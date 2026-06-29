import { Router } from 'express';
import { list, getOne, create, update, remove } from './products.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.service';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), list);
router.get('/:id', getOne);
router.post('/', authenticate, authorize('ADMIN', 'VENDOR'), validate(createProductSchema), create);
router.patch('/:id', authenticate, authorize('ADMIN', 'VENDOR'), validate(updateProductSchema), update);
router.delete('/:id', authenticate, authorize('ADMIN', 'VENDOR'), remove); // Ownership enforcement — vendor delete restricted to own products in service

export default router;
