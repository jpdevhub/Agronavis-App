import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

export const notificationRoutes = Router();
notificationRoutes.use(authMiddleware);
// TODO: GET /notifications, PUT /notifications/:id/read
