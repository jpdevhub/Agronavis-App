import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import prisma from './config/database';

async function bootstrap() {
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info('====================================');
    logger.info('   AGRONAVIS API');
    logger.info('====================================');
    logger.info(`Port        : ${env.PORT}`);
    logger.info(`Environment : ${env.NODE_ENV}`);
    logger.info(`API Base    : http://localhost:${env.PORT}/api/${env.API_VERSION}`);
    logger.info(`Health      : http://localhost:${env.PORT}/health`);
    logger.info('====================================');
  });

  // Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server and database closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });
}

bootstrap();
