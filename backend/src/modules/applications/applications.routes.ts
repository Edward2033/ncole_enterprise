import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { handleSubmit, handleList, handleGetOne, handleReview, handleAdminApply } from './applications.controller';

const router = Router();

// Public — anyone can submit an application
router.post('/', handleSubmit);

// Admin-only routes
router.get('/',           authenticate, authorize('ADMIN'), handleList);
router.get('/:id',        authenticate, authorize('ADMIN'), handleGetOne);
router.patch('/:id',      authenticate, authorize('ADMIN'), handleReview);
router.post('/admin/apply', authenticate, authorize('ADMIN'), handleAdminApply);

export default router;
