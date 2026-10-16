import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { handler } from '../../shared/http';
import { firesController } from './fires.controller';

export const fireRoutes = Router();

fireRoutes.use(requireAuth);

// Needs no farm: a farmer can see the national picture before mapping a field.
fireRoutes.get('/summary', handler(firesController.summary));
fireRoutes.get('/field/:fieldId', handler(firesController.nearField));
fireRoutes.get('/farm/:farmId', handler(firesController.near));
fireRoutes.get('/farm/:farmId/history', handler(firesController.history));
