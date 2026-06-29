import { Router } from 'express';
import { list, me, getOne, create, update, backfill } from './vendors.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { createVendorSchema, updateVendorSchema } from './vendors.service';
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
router.get('/me', authenticate, authorize('VENDOR'), me);
router.post('/backfill', authenticate, authorize('ADMIN'), backfill);
router.get('/:id', getOne);
router.post('/', authenticate, authorize('ADMIN'), validate(createVendorSchema), create);
router.patch('/:id', authenticate, authorize('ADMIN', 'VENDOR'), validate(updateVendorSchema), update);

export default router;
