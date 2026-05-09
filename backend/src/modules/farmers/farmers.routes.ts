import { Router } from 'express';
import { farmerController } from './farmers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createFarmerSchema, updateFarmerSchema } from './farmers.schema';

export const farmerRoutes = Router();

// All farmer routes require authentication
farmerRoutes.use(authMiddleware);

farmerRoutes.get('/me', farmerController.getMe);
farmerRoutes.post('/', validate(createFarmerSchema), farmerController.create);
farmerRoutes.put('/:id', validate(updateFarmerSchema), farmerController.update);
farmerRoutes.delete('/:id', farmerController.delete);
