import { Router } from 'express';

export const authRoutes = Router();
// Clerk handles actual auth — this module handles:
// POST /auth/webhook  → Clerk webhook for user sync
// GET  /auth/me       → Returns current user info from Clerk token
