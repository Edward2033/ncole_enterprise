import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response';
import {
  getInvoice,
  getMyInvoices,
  submitPayment,
  getMyPayments,
  adminVerifyPayment,
  adminListPayments,
  adminRevenueReport,
  vendorConfirmPayment,
  SubmitPaymentDto,
  VerifyPaymentDto,
  VendorConfirmPaymentDto,
} from './billing.service';
import { BillingPaymentStatus } from '@prisma/client';

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function myInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(50, Number(req.query['limit']) || 10);
    const { invoices, total } = await getMyInvoices(req.user!.sub, page, limit);
    sendSuccess(res, invoices, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function invoiceDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getInvoice(req.params['id']!, req.user!.sub)); } catch (e) { next(e); }
}

export async function payInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await submitPayment(req.params['id']!, req.user!.sub, req.body as SubmitPaymentDto), 201);
  } catch (e) { next(e); }
}

export async function myPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(50, Number(req.query['limit']) || 10);
    const { payments, total } = await getMyPayments(req.user!.sub, page, limit);
    sendSuccess(res, payments, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function vendorConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await vendorConfirmPayment(req.params['id']!, req.user!.sub, req.body as VendorConfirmPaymentDto));
  } catch (e) { next(e); }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Number(req.query['limit']) || 20);
    const status = req.query['status'] as BillingPaymentStatus | undefined;
    const { payments, total } = await adminListPayments(status, page, limit);
    sendSuccess(res, payments, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function adminInvoiceDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getInvoice(req.params['id']!, '')); } catch (e) { next(e); }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await adminVerifyPayment(req.params['id']!, req.body as VerifyPaymentDto));
  } catch (e) { next(e); }
}

export async function revenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    sendSuccess(res, await adminRevenueReport(from, to));
  } catch (e) { next(e); }
}
