import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { tasksController } from './tasks.controller';
import { createTaskSchema, idParamSchema, listTasksSchema } from './tasks.schema';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get('/', validate(listTasksSchema, 'query'), handler(tasksController.list));
taskRoutes.post('/', validate(createTaskSchema), handler(tasksController.create));
taskRoutes.patch('/:id/complete', validate(idParamSchema, 'params'), handler(tasksController.complete));
taskRoutes.patch('/:id/skip', validate(idParamSchema, 'params'), handler(tasksController.skip));
