import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';
import { sendError } from '@/shared/utils/response';
import { logger } from '@/config/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, details: err.details });
    }
    sendError(res, err.message, err.statusCode, err.details);
    return;
  }

  if (isObject(err)) {
    const e = err as Record<string, unknown>;
    const code = e['code'] as string | undefined;

    // Prisma unique constraint violation
    if (code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }

    // Prisma record not found
    if (code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }

    // Prisma table / relation does not exist — database migration has not been run
    if (code === 'P2021' || code === 'P2010') {
      const table = (e['meta'] as Record<string, unknown> | undefined)?.['table'] ?? 'unknown';
      logger.error(`Database table missing: ${table}. Run the required SQL migration.`, { code, table });
      sendError(res, 'Database setup incomplete — required migration has not been applied. Contact the administrator.', 500);
      return;
    }

    // Other Prisma errors — log the code so it is visible in server logs
    if (typeof code === 'string' && code.startsWith('P')) {
      logger.error('Prisma error', { code, message: e['message'], meta: e['meta'] });
      sendError(res, 'A database error occurred', 500);
      return;
    }
  }

  // Serialise the error properly so the log is never empty "{}"
  const serialised = err instanceof Error
    ? { message: err.message, stack: err.stack }
    : err;
  logger.error('Unhandled error', { err: serialised });
  sendError(res, 'Internal server error', 500);
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
