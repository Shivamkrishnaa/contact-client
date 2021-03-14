import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt-nodejs';
import moment from 'moment';
import config from './config';
import { db } from './models';

const TokenExtractor = function (req) {
  console.log(req.headers.phone);
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['XSRF-token'];
  }
  return token;
};


// JSON WEB TOKENS STRATEGY
passport.use(new JwtStrategy({
  jwtFromRequest: TokenExtractor,
  secretOrKey: config.app.secret,
  passReqToCallback: true
}, async (req, payload, done) => {
  try {
    let user = null;
    user = await db.User.findOne({
      where: { id: payload.sub }, attributes: ['id', 'phone', 'firstname', 'lastname', 'key']
    });
    if (!user) {
      return done('user', false);
    }
    user.type = payload.iam;
    if (new Date(payload.exp) < new Date()) {
      return done('expired', false);
    } user.type = payload.iam;

    return done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

// LOCAL STRATEGY
passport.use(new LocalStrategy({
  usernameField: 'phone',
  passReqToCallback: true
}, async (req, phone, password, done) => {
  try {
    db.User.findOne({
      where: { phone }, attributes: ['id', 'firstname', 'lastname', 'key'], required: true
    })
      .then(async (User) => {
        if (!User) {
          return done(null, false);
        }
        const isMatch = await User.comparePassword(password);

        if (!isMatch) {
          return done(`attempt:${5 - User.attempt}`, false);
        }

        done(null, User);
      })
      .catch((err) => {
        console.log(err);
        done('invalid', false);
      });
  } catch (error) {
    done(error, false);
  }
}));

// IAM ROOT STRATEGY
passport.use('root-login', new LocalStrategy({
  usernameField: 'email',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const user = await db.User.findOne({
      where: {
        email
      },
      attributes: ['id', 'firstname', 'lastname', 'email', 'password', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser', 'companyId', 'twoFA', 'otp', 'otpExpiry']
    });
    if (!user) {
      return done(null, false);
    }

    if (user.attempt == 5) {
      return done('attempt', false);
    }


    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      user.update({
        attempt: user.attempt + 1
      });
      return done(`attempt:${5 - user.attempt}`, false);
    }

    user.update({ attempt: 0 });

    if (user.twoFA) {
      if (req.body.otp !== user.otp) {
        return done('otp', false);
      }
      if (req.body.otp === user.otp) {
        if ((user.otpExpiry).getTime() < new Date().setMinutes((new Date()).getMinutes() - 30)) {
          return done('expired', false);
        }

        user.update({
          otpExpiry: new Date().setMinutes((new Date()).getMinutes() - 30)
        });
      }
    }
    if (!user.valid) {
      return done('invalid', false);
    }

    done(null, user);
  } catch (error) {
    console.log('error', error);
    done(error, false);
  }
}));


// LOCAL STRATEGY
passport.use('magic-login', new LocalStrategy({
  usernameField: 'email',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const { email, password } = req.params;
    const user = await db.User.findOne({ where: { email, isNewUser: 1 }, attributes: ['id', 'firstname', 'lastname', 'email', 'password', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser'] });
    if (!user) {
      return done(null, false);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return done('notMatch', false);
    }
    user.update({ attempt: 0 });

    user.type = 'root';
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));


// LOCAL STRATEGY
passport.use('otp-login', new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const user = await db.User.findOne({ where: { email }, attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'password', 'otp', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser'] });
    if (!user) {
      return done(null, false);
    }
    if (user.attempt == 5) {
      return done('attempt', false);
    }
    const isMatch = (user.otp == password);

    if (!isMatch) {
      user.update({ attempt: user.attempt + 1 });
      return done(`attempt:${5 - user.attempt}`, false);
    }
    user.update({ attempt: 0 });

    const date = new Date().getTime();
    const expiry = (date >= user.otpExpiry);
    if (expiry) {
      return done('expired', false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

// LOCAL STRATEGY
passport.use('Employee-magic-login', new LocalStrategy({
  usernameField: 'email',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const { email, password, alias } = req.params;
    const user = await db.Employee.findOne({
      where: { email }, attributes: ['id', 'firstname', 'lastname', 'email', 'password', 'otp', 'otpExpiry', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser'], required: true, include: [{ model: db.Company, where: { $or: { alias: { like: alias }, key: { like: alias } } } }]
    });
    if (!user) return done(null, false);

    if (!user.otp) return done('invalid', false);
    if (user.otp != password) return done('notMatch', false);

    if (new Date().getTime() >= moment(user.otpExpiry).add('days', 2).valueOf()) return done('expired', false);

    user.type = 'employee';

    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));


passport.use('email-otp-login', new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const user = await db.User.findOne({ where: { email }, attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'password', 'otp', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser'] });
    if (!user) {
      return done(null, false);
    }
    if (user.attempt == 5) {
      return done('attempt', false);
    }
    const isMatch = (user.otp == password);

    if (!isMatch) {
      user.update({ attempt: user.attempt + 1 });
      return done(`attempt:${5 - user.attempt}`, false);
    }
    user.update({ attempt: 0 });

    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));


// LOCAL STRATEGY
passport.use('Root-magic-login', new LocalStrategy({
  usernameField: 'email',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const { email, password, alias } = req.params;
    const user = await db.User.findOne({
      where: { email }, attributes: ['id', 'firstname', 'lastname', 'email', 'password', 'otp', 'otpExpiry', 'attempt', 'loggedOutAt', 'status', 'valid', 'createdAt', 'isNewUser'], required: true, include: [{ model: db.Company, where: { $or: { alias: { like: alias }, key: { like: alias } } } }]
    });
    if (!user) return done(null, false);

    if (!user.otp) return done('invalid', false);
    if (user.otp != password) return done('notMatch', false);

    if (new Date().getTime() >= moment(user.otpExpiry).add('days', 2).valueOf()) return done('expired', false);

    user.type = 'root';

    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));
