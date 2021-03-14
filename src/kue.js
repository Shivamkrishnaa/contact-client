import kue from 'kue';
import contact from './contact.json';
import { db } from './models';
import config from './config';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);

const redis = {
  port: config.redis.port,
  host: config.redis.host,
  auth: config.redis.auth
};
export var queue = kue.createQueue({ prefix: 'q', redis });

export default {
  init: () => {
    queue.process('send', (job, done) => {
      client.messages
        .create({ body: `${job.data.message} ${job.data.otp}.`, from: '+12185495004', to: job.data.to })
        .then(message => db.Sms.update({
          sentAt: Date.now(),
          status: 'success',
          body: job.data.message
        }, {
          where: {
            id: job.data.id
          }
        }))
        .then((message) => {
          done();
        })
        .catch((e) => {
          db.Sms.update({
            sentAt: Date.now(),
            status: 'failed',
            body: job.data.message
          }, {
            where: {
              id: job.data.id
            }
          });
          console.log(e); done();
        });
    });
    queue.process('aggregate-rating', (job, done) => {
      console.log(job.data);
      const { id } = job.data;
      db.movieRating.findOne({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('rating')), 'totalAvgRating'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalRatingCount'],
        ],
        where: {
          movieId: id
        }
      })
        .then((r) => {
          r = JSON.parse(JSON.stringify(r));
          console.log(JSON.stringify(r), r.totalAvgRating, Number(r.totalAvgRating));
          db.movie.update({
            totalAvgRating: Number(r.totalAvgRating),
            totalRatingCount: Number(r.totalRatingCount)
          }, {
            where: {
              id
            }
          });
          done();
        })
        .catch((r) => {
          done();
        });
      done();
    });
  }
};
