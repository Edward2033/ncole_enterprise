import { Router } from 'express';
import { place, myOrders, myOrderById, vendorOrders, riderOrders, assignRiderToOrder, all, updateStatus } from './orders.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { placeOrderSchema, updateOrderStatusSchema } from './orders.service';

const router = Router();

router.use(authenticate);

router.post('/',           authorize('CUSTOMER'),                    validate(placeOrderSchema),       place);
router.get('/my',          authorize('CUSTOMER'),                    myOrders);
router.get('/my/:id',      authorize('CUSTOMER'),                    myOrderById);
router.get('/vendor',      authorize('VENDOR'),                      vendorOrders);
router.get('/rider',       authorize('RIDER'),                       riderOrders);
router.get('/',            authorize('ADMIN'),                       all);
router.patch('/:id/assign-rider', authorize('ADMIN'),                assignRiderToOrder);
router.patch('/:id/status', authorize('ADMIN', 'VENDOR', 'RIDER'),   validate(updateOrderStatusSchema), updateStatus);

export default router;
