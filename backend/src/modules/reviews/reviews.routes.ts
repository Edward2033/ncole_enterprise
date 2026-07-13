import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { sendSuccess } from '@/shared/utils/response';
import { listReviews, createReview, deleteReview, createReviewSchema } from './reviews.service';

const router = Router({ mergeParams: true });

// GET /products/:productId/reviews — public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await listReviews(req.params['productId']!));
  } catch (e) { next(e); }
});

// POST /products/:productId/reviews — authenticated customers
router.post('/',
  authenticate,
  authorize('CUSTOMER'),
  validate(createReviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await createReview(req.user!.sub, req.params['productId']!, req.body), 201);
    } catch (e) { next(e); }
  }
);

// DELETE /products/:productId/reviews — own review only
router.delete('/',
  authenticate,
  authorize('CUSTOMER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteReview(req.user!.sub, req.params['productId']!);
      sendSuccess(res, null);
    } catch (e) { next(e); }
  }
);

export default router;
