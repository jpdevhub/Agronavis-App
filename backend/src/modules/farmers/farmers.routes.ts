import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { farmersController } from './farmers.controller';
import { pushTokenSchema, updateFarmerSchema } from './farmers.schema';

export const farmerRoutes = Router();

farmerRoutes.use(requireAuth);

farmerRoutes.get('/me', handler(farmersController.getMe));
farmerRoutes.patch('/me', validate(updateFarmerSchema), handler(farmersController.updateMe));
farmerRoutes.post(
  '/me/push-token',
  validate(pushTokenSchema),
  handler(farmersController.registerPushToken),
);
