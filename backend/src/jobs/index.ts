import cron, { type ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { runMarketPoll } from './market.job';
import { runWeatherPoll } from './weather.job';

const tasks: ScheduledTask[] = [];

/**
 * Guards against overlap: a poll that runs long must not have a second copy
 * started on top of it, which would double the upstream API spend.
 */
function guarded(name: string, job: () => Promise<unknown>): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) {
      logger.warn(`${name} is still running — skipping this tick`);
      return;
    }
    running = true;
    try {
      await job();
    } catch (error) {
      logger.error(`${name} threw`, { error: (error as Error).message });
    } finally {
      running = false;
    }
  };
}

export function startJobs(): void {
  if (!env.ENABLE_JOBS || env.isTest) {
    logger.info('Background jobs disabled (ENABLE_JOBS=false)');
    return;
  }

  tasks.push(cron.schedule(env.WEATHER_POLL_CRON, guarded('Weather poll', runWeatherPoll)));
  tasks.push(cron.schedule(env.MARKET_POLL_CRON, guarded('Market poll', runMarketPoll)));

  logger.info('Background jobs scheduled', {
    weather: env.WEATHER_POLL_CRON,
    market: env.MARKET_POLL_CRON,
  });
}

export function stopJobs(): void {
  for (const task of tasks) task.stop();
  tasks.length = 0;
}

export { runMarketPoll, runWeatherPoll };
