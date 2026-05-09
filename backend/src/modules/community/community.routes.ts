import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

export const communityRoutes = Router();
communityRoutes.use(authMiddleware);
// TODO: GET /community/posts, POST /community/posts, likes, comments
