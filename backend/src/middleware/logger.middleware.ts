import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/** Attaches a request ID and logs incoming requests */
export function loggerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.id = crypto.randomUUID();
  logger.debug(`→ ${req.method} ${req.path} [${req.id}]`);
  next();
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
