import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { z } from 'zod';
import { getHandler, addHandler, removeHandler, clearHandler, checkHandler } from './wishlist.controller';

const addSchema = z.object({ productId: z.string().cuid() });

const router = Router();
router.use(authenticate);
router.use(authorize('CUSTOMER'));

router.get('/',                        getHandler);
router.post('/',    validate(addSchema), addHandler);
router.delete('/clear',                clearHandler);
router.get('/:productId/check',        checkHandler);
router.delete('/:productId',           removeHandler);

export default router;
