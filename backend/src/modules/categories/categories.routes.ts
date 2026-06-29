import { Router } from 'express';
import { list, create, update, remove } from './categories.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { createCategorySchema, updateCategorySchema } from './categories.service';
import { verifyAccessToken } from '@/shared/utils/jwt';

// Optional auth — attaches req.user if a valid Bearer token is present, never blocks
function optionalAuth(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyAccessToken(header.slice(7)); } catch { /* ignore */ }
  }
  return next();
}

const router = Router();

router.get('/', optionalAuth, list);
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), update);
router.delete('/:id', authenticate, authorize('ADMIN'), remove);

export default router;
