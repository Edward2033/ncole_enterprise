import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/shared/errors/AppError';

type RequestPart = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      return next(AppError.badRequest('Validation failed', errors));
    }
    // Replace with coerced/defaulted values from Zod
    const request = req as unknown as Record<string, unknown>;
    request[part] = result.data;
    next();
  };
}
