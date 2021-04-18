import express from 'express';
import multer from 'multer';
import xmlController from './xml.controller';
import { validateBody, schemas } from '../../../middleware/validator';
import { sanitize } from '../../../middleware/sanitizer';
import { jwtStrategy } from '../../../middleware/strategy';

const upload = multer({ dest: 'uploads/' });

export const xmlRouter = express.Router();
xmlRouter.route('/').post(upload.single('file'), xmlController.index);
