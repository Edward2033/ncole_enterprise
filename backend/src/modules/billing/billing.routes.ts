import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { submitPaymentSchema, verifyPaymentSchema, revenueReportSchema } from './billing.service';
import {
  myInvoices,
  invoiceDetail,
  payInvoice,
  myPayments,
  adminPayments,
  adminInvoiceDetail,
  verifyPayment,
  revenueReport,
} from './billing.controller';

const router = Router();
router.use(authenticate);

// ─── Customer routes ──────────────────────────────────────────────────────────
router.get('/invoices', authorize('CUSTOMER'), myInvoices);
router.get('/invoices/:id', authorize('CUSTOMER'), invoiceDetail);
router.post('/invoices/:id/pay', authorize('CUSTOMER'), validate(submitPaymentSchema), payInvoice);
router.get('/payments', authorize('CUSTOMER'), myPayments);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/invoices/:id', authorize('ADMIN'), adminInvoiceDetail);
router.get('/admin/payments', authorize('ADMIN'), adminPayments);
router.patch('/admin/payments/:id/verify', authorize('ADMIN'), validate(verifyPaymentSchema), verifyPayment);
router.get('/admin/reports/revenue', authorize('ADMIN'), validate(revenueReportSchema, 'query'), revenueReport);

export default router;
