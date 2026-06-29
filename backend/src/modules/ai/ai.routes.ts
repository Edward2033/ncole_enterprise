import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@/middleware/validate';
import { chatSchema } from './ai.service';
import { chatHandler } from './ai.controller';
import { AppError } from '@/shared/errors/AppError';
import { verifyAccessToken } from '@/shared/utils/jwt';

const router = Router();

/**
 * POST /api/v1/ai/chat
 *
 * Public portal: no auth required.
 * All other portals: Bearer token required.
 */
function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      // Invalid/expired token on public portal — treat as unauthenticated, never block
    }
  }
  next();
}

function requireAuthForPrivatePortal(req: Request, _res: Response, next: NextFunction): void {
  const portal = req.body?.portal ?? 'PUBLIC';
  if (portal !== 'PUBLIC' && !req.user) {
    return next(AppError.unauthorized('Authentication required for this portal.'));
  }
  next();
}

router.post(
  '/chat',
  validate(chatSchema),
  optionalAuth,
  requireAuthForPrivatePortal,
  chatHandler,
);

export default router;
