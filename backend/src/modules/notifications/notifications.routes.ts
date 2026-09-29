import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { notificationsController } from './notifications.controller';

const idParamSchema = z.object({ id: z.string().uuid() });

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', handler(notificationsController.list));
notificationRoutes.patch('/read-all', handler(notificationsController.markAllRead));
notificationRoutes.patch(
  '/:id/read',
  validate(idParamSchema, 'params'),
  handler(notificationsController.markRead),
);
