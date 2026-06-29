import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/shared/utils/jwt';
import { AppError } from '@/shared/errors/AppError';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}
