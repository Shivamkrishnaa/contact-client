

import { queue } from '../../../kue';
import { db } from '../../../models';

export default {
  async movieList(req, res, next) {
    db.movie.findAll({
      attributes: ['name', 'totalAvgRating', 'totalRatingCount', 'id']
    })
      .then((contact) => {
        setTimeout(() => res.status(200).json({ data: contact }), 3000);
      })
      .catch((e) => {
        next(e);
      });
  },
  async movieCreate(req, res, next) {
    const { name } = req.body;
    db.movie.findOne({
      where: { name }
    })
      .then((movie) => {
        if (movie) throw new RequestError('Movie already exists.', 400);
        return db.movie.create({
          name,
          totalAvgRating: 0,
          totalRatingCount: 0
        });
      })
      .then(movie => res.status(200).json({ success: true, data: movie }))
      .catch((e) => {
        next(e);
      });
  },
  async createReview(req, res, next) {
    const { movieId } = req.params;
    const { rating, email } = req.body;
    const eme = email;
    console.log(email, '-email');
    db.User.findOrCreate({
      where: {
        email: String(eme)
      },
      defaults: {
        firstName: 'Random',
        email: String(eme)
      }
    }).then((r) => {
      console.log(JSON.parse(JSON.stringify(r)));
      return r;
    })
      .then(([userResp]) => {
        const user = JSON.parse(JSON.stringify(userResp));
        if (!user) throw new RequestError('User doesn`t exists.', 400);
        return db.movie.findOne({
          where: { id: Number(movieId) },
          include: [{
            model: db.movieRating,
            required: false,
            where: { userId: user.id }
          }]
        }).then(r => [r, user.id]);
      })
      .then(async ([movie, id]) => {
        if (!movie || (movie.movieRatings && movie.movieRatings.length)) throw new RequestError('You can only rate it once.', 400);
        return db.movieRating.findOrCreate({
          where: { movieId, userId: id },
          defaults: { rating }
        });
      })
      .then(() => {
        queue.create('aggregate-rating', {
          id: movieId
        }).save();
        return res.status(200).json({ success: true, data: { } });
      })
      .catch((e) => {
        next(e);
      });
  },
  async createComment(req, res, next) {
    const { movieId } = req.params;
    const { comment } = req.body;
    db.movie.findOne({
      where: { id: Number(movieId) }
    })
      .then((movie) => {
        if (!movie) throw new RequestError('Movie doesn`t exists.', 400);
        return db.movieComment.create({ text: comment, movieId });
      })
      .then(() => res.status(200).json({ success: true, data: { } }))
      .catch((e) => {
        next(e);
      });
  },
  async getComment(req, res, next) {
    const { movieId } = req.params;
    const where = (movieId && !Number.isNaN(Number(movieId)) && movieId > 0) ? { movieId } : {};
    const { limit, page } = req.query;
    const mypage = Number(page) || 1;
    const mylimit = Number(limit) || 10;
    db.movieComment.count({
      where
    })
      .then((count) => {
        const pages = Math.ceil(count / mylimit);
        const offset = mylimit * (mypage - 1);
        return db.movieComment.findAll({
          where,
          limit: mylimit,
          offset,
          order: [['createdAt', 'DESC']]
        }).then(r => [{ pages, data: r, count }]);
      })
      .then(([r]) => {
        res.status(200).json(r);
      }).catch((e) => {
        next(e);
      });
  },
  async getReview(req, res, next) {
    const { movieId } = req.params;
    const where = (movieId && !Number.isNaN(Number(movieId)) && movieId > 0) ? { movieId } : {};
    const { limit, page } = req.query;
    const mylimit = Number(limit) || 10;
    const mypage = Number(page) || 1;
    db.movieRating.count({
      where
    })
      .then((count) => {
        const pages = Math.ceil(count / mylimit);
        const offset = mylimit * (mypage - 1);
        return db.movieRating.findAll({
          where,
          raw: true,
          attributes: ['id', 'User.email', 'rating'],
          limit: mylimit,
          include: [{
            model: db.User,
            required: true
          }],
          offset,
          order: [['rating', 'DESC']]
        }).then(r => [{ pages, data: r, count }]);
      })
      .then(([r]) => {
        res.status(200).json(r);
      }).catch((e) => {
        next(e);
      });
  }

};
