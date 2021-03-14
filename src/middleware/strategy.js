import passport from 'passport';
import JWT from 'jsonwebtoken';
import config from '../config';
// import json from  ;

const JWTSign = function (user, date) {
  return JWT.sign({
    iss: config.app.name,
    sub: user.id,
    iam: user.type,
    iat: date.getTime(),
    exp: new Date().setMinutes(date.getMinutes() + 60)
  }, config.app.secret);
};

export var jwtStrategy = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    console.log('=====');
    const contype = req.headers['content-type'];
    const json = !(!contype || contype.indexOf('application/json') !== 0);
    if (!json && info && typeof info === 'string' && info.includes('isNewUser')) {
      if (req.url != '/change-password/' && req.url != '/order/success') {
        return res.redirect('/change-password/');
      }
    }
    if (err && err == 'expired') { return json ? res.status(500).json({ errors: ['Session is expired'] }) : res.redirect('/logout'); }
    if (err && err == 'invalid') { return json ? res.status(500).json({ errors: ['Invalid token recieved'] }) : res.redirect('/logout'); }
    if (err && err == 'user') { return json ? res.status(500).json({ errors: ['Invalid user recieved'] }) : res.redirect('/logout'); }
    if (err && Object.keys(err).length) { return res.status(500).json({ errors: [err] }); }
    if (err) { return res.status(403).json({ errors: ['Invalid user recieved'] }); }
    if (!user) { return json ? res.status(403).json({ errors: ['Invalid user recieved'] }) : res.redirect('/logout'); }
    // Update Token
    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });

    req.user = JSON.parse(JSON.stringify(user));
    next();
  })(req, res, next);
};

export var jwtLogoutStrategy = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

export var localStrategy = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    console.log(err);
    if (err && err == 'invalid') { return res.status(401).json({ errors: ['Email Id not verified'] }); }
    if (err && err.startsWith('attempt:')) { return res.status(401).json({ errors: [`Invalid Credentials (${err.split(':')[1]} Attempt(s) Left)`] }); }
    if (err) { return res.status(401).json({ errors: [err] }); }
    if (!user) { return res.status(401).json({ errors: ['Invalid Credentials'] }); }
    user.type = 'root';
    req.user = user;
    next();
  })(req, res, next);
};


export var rootLoginStrategy = (req, res, next) => {
  passport.authenticate('root-login', {
    session: false
  }, (err, user, info) => {
    if (err && err.startsWith('isNewUser')) { const email = err.split('/'); return res.status(200).json({ isnewuser: 1, email: email[1] }); }
    if (err && err == 'otp') { return res.status(401).json({ errors: ['Invalid OTP recieved'] }); }
    if (err && err == 'invalid') { return res.status(401).json({ errors: ['$email:Email Id not verified'] }); }
    if (err && err == 'attempt') { return res.status(401).json({ errors: ['$password:Too many invalid attempts. Please reset your credentials.'] }); }
    if (err && err.startsWith('attempt:')) { return res.status(401).json({ errors: [`$password:Invalid Credentials (${err.split(':')[1]} Attempt(s) Left)`] }); }
    if (err && err.keyword && err.keyword.startsWith('attempt:')) { return res.status(401).json({ errors: [`$password:Invalid Credentials (${err.split(':')[1]} Attempt(s) Left)`] }); }
    if (err) { return res.status(401).json({ errors: [err] }); }
    if (!user) { return res.status(401).json({ errors: ['Invalid Credentials'] }); }
    user.type = 'root';
    req.user = user;
    next();
  })(req, res, next);
};

export var magicLinkStrategy = (req, res, next) => {
  passport.authenticate('magic-login', { session: false }, (err, user, info) => {
    if (err && err == 'notMatch') { return next(new RequestError('Invalid Token', 400)); }
    if (err) { return next(new RequestError('Server Error', 500, err)); }
    if (!user) { return next(new RequestError('Invalid User Recieved', 400, err)); }

    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });
    user.type = 'root';
    req.user = user;
    next();
  })(req, res, next);
};

export var otpLoginStrategy = (req, res, next) => {
  passport.authenticate('otp-login', { session: false }, (err, user, info) => {
    if (err && err == 'attempt') { return res.status(401).json({ errors: ['Too many invalid attempts. Please reset your credentials.'] }); }
    if (err && err.startsWith('attempt:')) { return res.status(401).json({ errors: [`Invalid Credentials (${err.split(':')[1]} Attempt(s) Left)`] }); }
    if (err && err == 'expired') { return res.status(401).json({ errors: ['OTP expired.'] }); }
    if (err) { return res.status(401).json({ errors: [err] }); }
    if (!user) { return res.status(401).json({ errors: ['Invalid Credentials'] }); }
    user.type = 'root';
    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });
    req.user = user;
    next();
  })(req, res, next);
};

export var employeeMagicStrategy = (req, res, next) => {
  passport.authenticate('Employee-magic-login', { session: false }, (err, user, info) => {
    if (err && err == 'notMatch') { return next(new RequestError('Invalid Token', 410)); }
    if (err && err == 'invalid') { return next(new RequestError('Invalid Token', 410)); }
    if (err && err == 'expired') { return next(new RequestError('Login link expired.', 410)); }
    if (err) { return next(new RequestError('Server Error', 500, err)); }
    if (!user) { return next(new RequestError('Invalid User Recieved', 400, err)); }

    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });
    req.user = user;
    next();
  })(req, res, next);
};

export var emailOtpLoginStrategy = (req, res, next) => {
  passport.authenticate('email-otp-login', { session: false }, (err, user, info) => {
    if (err && err == 'attempt') { return res.status(401).json({ errors: ['Too many invalid attempts. Please reset your credentials.'] }); }
    if (err && err.startsWith('attempt:')) { return res.status(401).json({ errors: [`Invalid Credentials (${err.split(':')[1]} Attempt(s) Left)`] }); }
    if (err && err == 'expired') { return res.status(401).json({ errors: ['OTP expired.'] }); }
    if (err) { return res.status(401).json({ errors: [err] }); }
    if (!user) { return res.status(401).json({ errors: ['Invalid Credentials'] }); }
    user.type = 'root';
    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });
    req.user = user;
    next();
  })(req, res, next);
};


export var rootMagicStrategy = (req, res, next) => {
  passport.authenticate('Root-magic-login', { session: false }, (err, user, info) => {
    if (err && err == 'notMatch') { return next(new RequestError('Invalid Token', 410)); }
    if (err && err == 'invalid') { return next(new RequestError('Invalid Token', 410)); }
    if (err && err == 'expired') { return next(new RequestError('Login link expired.', 410)); }
    if (err) { return next(new RequestError('Server Error', 500, err)); }
    if (!user) { return next(new RequestError('Invalid User Recieved', 400, err)); }

    const date = new Date();
    const token = JWTSign(user, date);
    res.cookie('XSRF-token', token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure
    });
    req.user = user;
    next();
  })(req, res, next);
};
