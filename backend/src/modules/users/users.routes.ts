import { Router, Request, Response, NextFunction } from 'express';
import { getMeHandler, updateMeHandler, listUsersHandler, adminUpdateUserHandler, adminCreateUserHandler, changePasswordHandler } from './users.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { updateProfileSchema, adminUpdateUserSchema, createUserSchema, changePasswordSchema } from './users.service';
import { prisma } from '@/config/database';
import { sendSuccess } from '@/shared/utils/response';

const router = Router();

router.use(authenticate);

router.get('/me', getMeHandler);
router.patch('/me', validate(updateProfileSchema), updateMeHandler);
router.post('/me/change-password', validate(changePasswordSchema), changePasswordHandler);
router.get('/', authorize('ADMIN'), listUsersHandler);
router.post('/', authorize('ADMIN'), validate(createUserSchema), adminCreateUserHandler);
router.patch('/:id', authorize('ADMIN'), validate(adminUpdateUserSchema), adminUpdateUserHandler);

// Admin: activity / audit log
router.get('/activity-log', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Math.max(1, Number(req.query['page'])   || 1);
    const limit  = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
    const action = req.query['action'] as string | undefined;
    const where  = action ? { action: action as import('@prisma/client').AuditAction } : {};
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.activityLog.count({ where }),
    ]);
    // Attach user name separately to avoid circular import
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
    const users   = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const enriched = logs.map(l => ({ ...l, user: l.userId ? userMap[l.userId] ?? null : null }));
    sendSuccess(res, enriched, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

export default router;
