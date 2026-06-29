import { Router, Request, Response, NextFunction } from 'express';
import {
  list, markRead, markAllReadHandler, remove,
  broadcast, getPrefsHandler, updatePrefsHandler,
} from './notifications.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { prisma } from '@/config/database';
import { sendSuccess } from '@/shared/utils/response';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

const broadcastSchema = z.object({
  type:     z.nativeEnum(NotificationType),
  title:    z.string().min(1).max(200),
  message:  z.string().min(1).max(1000),
  userIds:  z.array(z.string().cuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const prefsSchema = z.object({
  inApp:        z.boolean().optional(),
  email:        z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions:   z.boolean().optional(),
});

const router = Router();

router.use(authenticate);

router.get('/',            list);
router.patch('/read-all',  markAllReadHandler);
router.patch('/:id/read',  markRead);
router.delete('/:id',      remove);

// Preferences
router.get('/preferences',   getPrefsHandler);
router.patch('/preferences', validate(prefsSchema), updatePrefsHandler);

// Admin-only broadcast
router.post('/broadcast', authorize('ADMIN'), validate(broadcastSchema), broadcast);

// Admin-only: platform-wide notification list with pagination
router.get('/admin/all', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, Number(req.query['page'])  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
    const skip  = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.notification.count(),
    ]);
    sendSuccess(res, items, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

export default router;
