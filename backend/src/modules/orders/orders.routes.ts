import { Router } from 'express';
import { place, myOrders, myOrderById, vendorOrders, riderOrders, assignRiderToOrder, all, updateStatus } from './orders.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { placeOrderSchema, updateOrderStatusSchema } from './orders.service';

const router = Router();

router.use(authenticate);

// Any authenticated user can place an order — ADMIN/VENDOR/RIDER can shop too.
// ensureCustomer() in the service auto-provisions a Customer profile if one
// does not exist yet, so no role is locked out of purchasing.
// Note: authenticate is NOT repeated here — router.use(authenticate) above already covers all routes.
router.post('/',           validate(placeOrderSchema),       place);
router.get('/my',          authorize('CUSTOMER', 'ADMIN', 'VENDOR', 'RIDER'), myOrders);
router.get('/my/:id',      authorize('CUSTOMER', 'ADMIN', 'VENDOR', 'RIDER'), myOrderById);
router.get('/vendor',      authorize('VENDOR'),                      vendorOrders);
router.get('/rider',       authorize('RIDER'),                       riderOrders);
router.get('/',            authorize('ADMIN'),                       all);
router.patch('/:id/assign-rider', authorize('ADMIN'),                assignRiderToOrder);
router.patch('/:id/status', authorize('ADMIN', 'VENDOR', 'RIDER'),   validate(updateOrderStatusSchema), updateStatus);

export default router;
