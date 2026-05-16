import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/express';
import { AppError } from './error.middleware';

/** Verifies Clerk JWT from Authorization header and attaches userId to request */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No authorization token provided');
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY as string });
    const userId = payload.sub;

    req.userId = userId;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, 'Invalid or expired token'));
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
