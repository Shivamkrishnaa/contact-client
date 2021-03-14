import express from 'express';
import authController from './auth.controller';
import { validateBody, schemas } from '../../../middleware/validator';
import { sanitize } from '../../../middleware/sanitizer';
import { localStrategy } from '../../../middleware/strategy';

export const authRouter = express.Router();
authRouter.route('/login').post(sanitize(), validateBody(schemas.loginSchema), localStrategy, authController.login);
authRouter.route('/register').post(sanitize(), validateBody(schemas.registerSchema), authController.register);
