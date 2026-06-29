import { Response } from 'express';

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiMeta,
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown,
): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
}
