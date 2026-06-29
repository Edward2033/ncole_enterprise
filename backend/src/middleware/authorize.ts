import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';
import { Role } from '@prisma/client';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role as Role)) {
      return next(AppError.forbidden(`Requires one of roles: ${roles.join(', ')}`));
    }
    next();
  };
}
