import compression from 'compression';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { requestContext } from './middleware/request-context.middleware';

import { advisoryRoutes } from './modules/advisory/advisory.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { communityRoutes } from './modules/community/community.routes';
import { cropRoutes } from './modules/crops/crops.routes';
import { farmerRoutes } from './modules/farmers/farmers.routes';
import { farmRoutes } from './modules/farms/farms.routes';
import { marketRoutes } from './modules/market/market.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { soilRoutes } from './modules/soil/soil.routes';
import { storageRoutes } from './modules/storage/storage.routes';
import { taskRoutes } from './modules/tasks/tasks.routes';
import { weatherRoutes } from './modules/weather/weather.routes';

export function createApp(): Application {
  const app = express();

  // Behind Render/Fly/Nginx the client IP arrives in X-Forwarded-For; the rate
  // limiter would otherwise bucket every request under the proxy's address.
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header: a native app or a server-to-server call, not a browser.
        if (!origin) return callback(null, true);
        if (env.allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(requestContext);

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      // Health checks must never be throttled — a load balancer polls them.
      skip: (req) => req.path === '/health',
      message: { success: false, error: 'Too many requests. Please slow down.' },
    }),
  );

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'agronavis-api',
      version: process.env.npm_package_version ?? '1.2.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  const prefix = `/api/${env.API_VERSION}`;

  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/farmers`, farmerRoutes);
  app.use(`${prefix}/farms`, farmRoutes);
  app.use(`${prefix}/crops`, cropRoutes);
  app.use(`${prefix}/tasks`, taskRoutes);
  app.use(`${prefix}/soil`, soilRoutes);
  app.use(`${prefix}/advisory`, advisoryRoutes);
  app.use(`${prefix}/weather`, weatherRoutes);
  app.use(`${prefix}/market`, marketRoutes);
  app.use(`${prefix}/community`, communityRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/storage`, storageRoutes);

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Agronavis API',
      version: '1.2.0',
      base: prefix,
      health: '/health',
      modules: [
        'auth',
        'farmers',
        'farms',
        'crops',
        'tasks',
        'soil',
        'advisory',
        'weather',
        'market',
        'community',
        'notifications',
        'storage',
      ],
    });
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
