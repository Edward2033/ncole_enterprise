import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

if (process.env.NODE_ENV !== 'test') {
  console.log('DATABASE_URL loaded:', Boolean(process.env.DATABASE_URL));
  console.log('NODE_ENV:', process.env.NODE_ENV);
}

function describeDb(url: string | undefined) {
  if (!url) return { host: undefined, port: undefined, database: undefined };
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || undefined,
      database: u.pathname ? u.pathname.replace(/^\//, '') : undefined,
    };
  } catch {
    return { host: undefined, port: undefined, database: undefined };
  }
}

async function connectWithRetry(maxAttempts = 5, baseDelayMs = 500) {
  const dbInfo = describeDb(process.env.DATABASE_URL);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info('Attempting database connection', {
        attempt,
        maxAttempts,
        db: {
          ...dbInfo,
          // Do not log secrets
          urlSet: Boolean(process.env.DATABASE_URL),
        },
      });

      await prisma.$connect();
      return;
    } catch (error) {
      lastError = error;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      logger.error('Database connection attempt failed', {
        attempt,
        maxAttempts,
        delayMs: delay,
        error,
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

const server = app.listen(env.PORT, async () => {
  try {
    if (!process.env.DATABASE_URL) {
      logger.error('❌ DATABASE_URL is missing from environment');
      process.exit(1);
    }

    await connectWithRetry(5, 500);

    logger.info('✅ Database connected');
    logger.info(
      `🚀 N_COLE Interpress API running on port ${env.PORT} [${env.NODE_ENV}]`
    );
  } catch (error) {
    logger.error('❌ Database connection failed', { error });
    process.exit(1);
  }
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);


  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } finally {
      logger.info('Server closed');
      process.exit(0);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});