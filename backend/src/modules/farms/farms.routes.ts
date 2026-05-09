import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

export const farmRoutes = Router();
farmRoutes.use(authMiddleware);
// TODO: GET /farms, POST /farms, GET /farms/:id, PUT /farms/:id, DELETE /farms/:id
