import { Router } from 'express';
import { list, create, update, remove } from './addresses.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { createAddressSchema, updateAddressSchema } from './addresses.service';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', validate(createAddressSchema), create);
router.patch('/:id', validate(updateAddressSchema), update);
router.delete('/:id', remove);

export default router;
