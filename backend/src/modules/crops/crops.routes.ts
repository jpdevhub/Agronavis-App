import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

export const cropRoutes = Router();
cropRoutes.use(authMiddleware);
// TODO: CRUD for crops, scan result storage
