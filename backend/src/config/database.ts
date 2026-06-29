import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

if (process.env.NODE_ENV !== 'test') console.log('Prisma using DATABASE_URL loaded:', Boolean(process.env.DATABASE_URL));

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });


if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

