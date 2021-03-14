import express from 'express';
import v1MovieController from './v1Movie.controller';
import { validateBody, schemas } from '../../../middleware/validator';
import { sanitize } from '../../../middleware/sanitizer';
import { jwtStrategy } from '../../../middleware/strategy';

export const v1MovieRouter = express.Router();
v1MovieRouter.route('/').get(v1MovieController.movieList);
v1MovieRouter.route('/').post(validateBody(schemas.createMovie), v1MovieController.movieCreate);
v1MovieRouter.route('/comment/:movieId').post(validateBody(schemas.createCommentMovie), /*  jwtStrategy,  */v1MovieController.createComment);
v1MovieRouter.route('/rating/:movieId').post(validateBody(schemas.createRatingMovie), /* jwtStrategy,  */v1MovieController.createReview);
v1MovieRouter.route('/comment/:movieId').get(v1MovieController.getComment);
v1MovieRouter.route('/rating/:movieId').get(v1MovieController.getReview);
