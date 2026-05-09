import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

export const advisoryRoutes = Router();
advisoryRoutes.use(authMiddleware);
// TODO: GET /advisory?farmId=, AI advisory generation
