import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { handler } from '../../shared/http';
import { satelliteController } from './satellite.controller';

export const satelliteRoutes = Router();

satelliteRoutes.use(requireAuth);

// Field first: a farm's single point can be a thousand kilometres from the
// field being looked at. Same reasoning as weather and fires.
satelliteRoutes.get('/field/:fieldId', handler(satelliteController.forField));
satelliteRoutes.get('/farm/:farmId', handler(satelliteController.forFarm));
