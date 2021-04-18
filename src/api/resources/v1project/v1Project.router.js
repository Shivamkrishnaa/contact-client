import express from 'express';
import v1ProjectController from './v1Project.controller';
import { validateBody, schemas } from '../../../middleware/validator';
// import { sanitize } from '../../../middleware/sanitizer';
// import { jwtStrategy } from '../../../middleware/strategy';

export const v1ProjectRouter = express.Router();
v1ProjectRouter.route('/').post(v1ProjectController.index);
v1ProjectRouter.route('/:projectId').patch(validateBody(schemas.createProject), v1ProjectController.project);
