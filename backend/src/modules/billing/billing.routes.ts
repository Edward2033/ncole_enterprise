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

// ─── Customer-facing routes (all authenticated roles — any user can have invoices)
router.get('/invoices',           authorize('CUSTOMER','ADMIN','VENDOR','RIDER'), myInvoices);
router.get('/invoices/:id',       authorize('CUSTOMER','ADMIN','VENDOR','RIDER'), invoiceDetail);
router.post('/invoices/:id/pay',  authorize('CUSTOMER','ADMIN','VENDOR','RIDER'), validate(submitPaymentSchema), payInvoice);
router.get('/payments',           authorize('CUSTOMER','ADMIN','VENDOR','RIDER'), myPayments);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/invoices/:id', authorize('ADMIN'), adminInvoiceDetail);
router.get('/admin/payments', authorize('ADMIN'), adminPayments);
router.patch('/admin/payments/:id/verify', authorize('ADMIN'), validate(verifyPaymentSchema), verifyPayment);
router.get('/admin/reports/revenue', authorize('ADMIN'), validate(revenueReportSchema, 'query'), revenueReport);

export default router;
