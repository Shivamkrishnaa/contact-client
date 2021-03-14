

import { queue } from '../../../kue';
import { db } from '../../../models';

const crypto = require('crypto');

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
export default {
  async userList(req, res, next) {
    db.User.findAll({
      where: { email: null }
    })
      .then((contact) => {
        setTimeout(() => res.status(200).json({ data: contact }), 3000);
      })
      .catch((e) => {
        next(e);
      });
  },
  async fetchUser(req, res, next) {
    const { userId } = req.params;
    db.User.findOne({
      where: { key: userId, email: null }
    }).then((r) => {
      if (r) {
        return db.Sms.findOrCreate({
          where: {
            status: 'initiated',
            userId: r.id
          },
          defaults: {
            otp: getRandomInt(111111),
            key: crypto.randomBytes(10).toString('hex')
          }
        }).then(sms => [sms, r]);
      }
      throw new RequestError('User doesn`t exists.', 400);
    })
      .then(([sms, user]) => {
        if (sms && user) return res.status(200).json({ data: { user, sms: sms[0] } });
        throw new RequestError('User doesn`t exists.', 400);
      })
      .catch((e) => {
        next(e);
      });
  },
  async sendMessage(req, res, next) {
    const { userId, smsId } = req.params;
    const { message } = req.body;
    db.User.findOne({
      where: { key: userId, email: null }
    })
      .then((contact) => {
        if (contact) {
          return db.Sms.findOne({
            where: {
              status: 'initiated',
              userId: contact.id,
              key: smsId
            },
            include: [{
              model: db.User,
              required: true,
              where: { key: userId }
            }]
          }).then(r => [r, contact]);
        } throw new RequestError('User doesn`t exists.', 400);
      })
      .then(([sms, contact]) => {
        if (!sms) throw new RequestError('Sms already sent or invalid request.', 400);
        else if (sms && contact) {
          queue.create('send', {
            id: sms.id,
            to: contact.phone,
            message,
            otp: sms.otp
          }).save();
          return res.status(200).json({ success: true });
        } else throw new RequestError('Invalid request.', 400);
      })
      .catch((e) => {
        next(e);
      });
  },
  async messageList(req, res, next) {
    db.Sms.findAll({
      where: { status: 'success' },
      include: [{
        model: db.User,
        required: true
      }]
    })
      .then(contact => res.status(200).json({ data: contact }))
      .catch((e) => {
        next(e);
      });
  },

};
