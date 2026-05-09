import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';

// Module Routes
import { farmerRoutes } from './modules/farmers/farmers.routes';
import { farmRoutes } from './modules/farms/farms.routes';
import { cropRoutes } from './modules/crops/crops.routes';
import { advisoryRoutes } from './modules/advisory/advisory.routes';
import { weatherRoutes } from './modules/weather/weather.routes';
import { marketRoutes } from './modules/market/market.routes';
import { communityRoutes } from './modules/community/community.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { authRoutes } from './modules/auth/auth.routes';

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());

  // CORS
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests. Please slow down.' },
    })
  );

  // Request Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
  app.use(loggerMiddleware);

  // Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      service: 'Agronavis API',
    });
  });

  // API Routes
  const prefix = `/api/${env.API_VERSION}`;

  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/farmers`, farmerRoutes);
  app.use(`${prefix}/farms`, farmRoutes);
  app.use(`${prefix}/crops`, cropRoutes);
  app.use(`${prefix}/advisory`, advisoryRoutes);
  app.use(`${prefix}/weather`, weatherRoutes);
  app.use(`${prefix}/market`, marketRoutes);
  app.use(`${prefix}/community`, communityRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);

  // Root Info
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Agronavis API',
      version: '1.0.0',
      docs: `${prefix}/docs`,
      health: '/health',
    });
  });

  // 404
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
  });

  // Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
}
