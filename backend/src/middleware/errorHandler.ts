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

  // Prisma unique constraint violation
  if (isObject(err) && (err as Record<string, unknown>).code === 'P2002') {
    sendError(res, 'A record with this value already exists', 409);
    return;
  }

  logger.error('Unhandled error', { err });
  sendError(res, 'Internal server error', 500);
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
