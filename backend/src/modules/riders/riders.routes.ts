import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { prisma } from '@/config/database';
import { sendSuccess } from '@/shared/utils/response';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

// ─── Admin: list all riders ───────────────────────────────────────────────────
router.get('/', authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const riders = await prisma.rider.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, riders);
  } catch (e) { next(e); }
});

// ─── Rider: own profile ───────────────────────────────────────────────────────
router.get('/me', authorize('RIDER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user!.sub },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
    if (!rider) { res.status(404).json({ success: false, error: 'Rider profile not found' }); return; }
    sendSuccess(res, rider);
  } catch (e) { next(e); }
});

// ─── Admin: update rider (verify, suspend, vehicle info) ─────────────────────
const riderPatchSchema = z.object({
  isVerified:  z.boolean().optional(),
  vehicleType: z.string().max(100).optional(),
  plateNumber: z.string().max(20).optional(),
  status:      z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).optional(),
});

router.patch('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = riderPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid fields', details: parsed.error.flatten() });
      return;
    }
    const rider = await prisma.rider.update({
      where: { id: req.params['id']! },
      data: parsed.data,
      include: { user: { select: { name: true, email: true } } },
    });
    sendSuccess(res, rider);
  } catch (e) { next(e); }
});

// ─── Admin: delete rider ──────────────────────────────────────────────────────
router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.rider.delete({ where: { id: req.params['id']! } });
    sendSuccess(res, null);
  } catch (e) { next(e); }
});

export default router;
