import { Router } from 'express';
import { get, add, update, remove, clear } from './cart.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { addCartItemSchema, updateCartItemSchema } from './cart.service';

const router = Router();

router.use(authenticate);

router.get('/', get);
router.post('/items', validate(addCartItemSchema), add);
router.patch('/items/:id', validate(updateCartItemSchema), update);
router.delete('/items/:id', remove);
router.delete('/', clear);

export default router;
