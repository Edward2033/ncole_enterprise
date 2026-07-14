import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';
import { PaymentGateway, BillingPaymentStatus } from '@prisma/client';
import { createNotification } from '@/modules/notifications/notifications.service';

// ─── Number Generators ────────────────────────────────────────────────────────

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Use atomic DB sequence to prevent duplicate numbers under concurrency
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('invoice_number_seq')
  `.catch(async () => {
    // Sequence may not exist yet — create it once, then retry
    await prisma.$executeRaw`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1`;
    return prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('invoice_number_seq')`;
  });
  return `INV-${year}-${String(Number(result[0].nextval)).padStart(6, '0')}`;
}

async function generateBillingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('payment_number_seq')
  `.catch(async () => {
    await prisma.$executeRaw`CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1`;
    return prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('payment_number_seq')`;
  });
  return `PAY-${year}-${String(Number(result[0].nextval)).padStart(6, '0')}`;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const submitPaymentSchema = z.object({
  gateway: z.nativeEnum(PaymentGateway),
  gatewayRef: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  action: z.enum(['VERIFY', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export const vendorConfirmPaymentSchema = z.object({
  gatewayRef: z.string().min(1),
});

export const revenueReportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type SubmitPaymentDto = z.infer<typeof submitPaymentSchema>;
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
export type VendorConfirmPaymentDto = z.infer<typeof vendorConfirmPaymentSchema>;

// ─── Invoice ──────────────────────────────────────────────────────────────────

/** Auto-generate invoice when order is placed (called from orders.service) */
export async function generateInvoiceForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) throw AppError.notFound('Order');

  // Idempotent — return existing invoice if already created
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  const invoiceNumber = await generateInvoiceNumber();

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      customerId: order.customerId,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      total: order.total,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });
}

export async function getInvoice(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: { include: { items: true, address: true } },
      payments: true,
      customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
    },
  });
  if (!invoice) throw AppError.notFound('Invoice');

  // Customers can only see their own
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer && userId) throw AppError.forbidden();
  if (customer && invoice.customerId !== customer.id) throw AppError.forbidden();

  return invoice;
}

export async function getMyInvoices(userId: string, page: number, limit: number) {
  let customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) customer = await prisma.customer.create({ data: { userId } });

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { customerId: customer.id },
      include: { order: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where: { customerId: customer.id } }),
  ]);
  return { invoices, total };
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export async function submitPayment(invoiceId: string, userId: string, dto: SubmitPaymentDto) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw AppError.forbidden('No customer profile');

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw AppError.notFound('Invoice');
  if (invoice.customerId !== customer.id) throw AppError.forbidden();
  if (invoice.status === 'PAID') throw AppError.badRequest('Invoice already paid');
  if (invoice.status === 'CANCELLED') throw AppError.badRequest('Invoice is cancelled');

  const billingNumber = await generateBillingNumber();

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        billingNumber,
        invoiceId,
        customerId: customer.id,
        gateway: dto.gateway,
        amount: invoice.total,
        gatewayRef: dto.gatewayRef,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await tx.paymentTransaction.create({
      data: {
        paymentId: p.id,
        type: 'CREDIT',
        amount: invoice.total,
        description: `Payment submitted via ${dto.gateway}`,
      },
    });

    await tx.invoice.update({ where: { id: invoiceId }, data: { status: 'ISSUED' } });

    return p;
  });

  createNotification({
    userId,
    type: 'PAYMENT_STATUS',
    title: 'Payment Submitted',
    message: `Payment ${billingNumber} submitted. Awaiting verification.`,
    metadata: { paymentId: payment.id, invoiceId },
  }).catch(() => null);

  return payment;
}

export async function getMyPayments(userId: string, page: number, limit: number) {
  let customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) customer = await prisma.customer.create({ data: { userId } });

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { customerId: customer.id },
      include: { invoice: true, transactions: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where: { customerId: customer.id } }),
  ]);
  return { payments, total };
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

/** Vendor confirms cash-on-delivery or manual payment received for their order */
export async function vendorConfirmPayment(
  paymentId: string,
  vendorUserId: string,
  dto: VendorConfirmPaymentDto,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          order: { include: { items: { include: { product: { select: { vendorId: true } } } } } },
          customer: { include: { user: true } },
        },
      },
    },
  });
  if (!payment) throw AppError.notFound('Payment');

  // Ensure the payment belongs to an order that has items from this vendor
  const vendor = await prisma.vendor.findUnique({ where: { userId: vendorUserId } });
  if (!vendor) throw AppError.forbidden('No vendor profile');
  const hasItem = payment.invoice.order.items.some(i => i.product?.vendorId === vendor.id);
  if (!hasItem) throw AppError.forbidden('Payment does not belong to your orders');

  if (!['SUBMITTED', 'PENDING'].includes(payment.status)) {
    throw AppError.badRequest('Payment is not in a confirmable state');
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED', verifiedAt: now, completedAt: now, gatewayRef: dto.gatewayRef },
    });
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID', paidAt: now },
    });
    await tx.order.update({
      where: { id: payment.invoice.orderId },
      data: { paymentStatus: 'PAID' },
    });
    await tx.paymentTransaction.create({
      data: {
        paymentId,
        type: 'CREDIT',
        amount: payment.amount,
        description: `Payment confirmed by vendor (ref: ${dto.gatewayRef})`,
      },
    });
    return p;
  });

  createNotification({
    userId: payment.invoice.customer.user.id,
    type: 'PAYMENT_STATUS',
    title: 'Payment Confirmed',
    message: `Your payment ${payment.billingNumber} has been confirmed.`,
    metadata: { paymentId, invoiceId: payment.invoiceId },
  }).catch(() => null);

  return updated;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminVerifyPayment(paymentId: string, dto: VerifyPaymentDto) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: { include: { customer: { include: { user: true } } } } },
  });
  if (!payment) throw AppError.notFound('Payment');
  if (!['SUBMITTED', 'PENDING'].includes(payment.status)) {
    throw AppError.badRequest('Payment is not in a verifiable state');
  }

  const isVerified = dto.action === 'VERIFY';
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const newStatus: BillingPaymentStatus = isVerified ? 'COMPLETED' : 'REJECTED';

    const p = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        verifiedAt: isVerified ? now : undefined,
        completedAt: isVerified ? now : undefined,
        rejectedAt: isVerified ? undefined : now,
        rejectionReason: dto.rejectionReason,
      },
    });

    if (isVerified) {
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PAID', paidAt: now },
      });
      await tx.order.update({
        where: { id: payment.invoice.orderId },
        data: { paymentStatus: 'PAID' },
      });
    }

    await tx.paymentTransaction.create({
      data: {
        paymentId,
        type: isVerified ? 'CREDIT' : 'DEBIT',
        amount: payment.amount,
        description: isVerified ? 'Payment verified by admin' : `Payment rejected: ${dto.rejectionReason ?? 'no reason'}`,
      },
    });

    return p;
  });

  const customerUserId = payment.invoice.customer.user.id;
  createNotification({
    userId: customerUserId,
    type: 'PAYMENT_STATUS',
    title: isVerified ? 'Payment Confirmed' : 'Payment Rejected',
    message: isVerified
      ? `Your payment ${payment.billingNumber} has been verified and completed.`
      : `Your payment ${payment.billingNumber} was rejected. ${dto.rejectionReason ?? ''}`,
    metadata: { paymentId, invoiceId: payment.invoiceId },
  }).catch(() => null);

  return updated;
}

export async function adminListPayments(
  status: BillingPaymentStatus | undefined,
  page: number,
  limit: number,
) {
  const where = status ? { status } : {};
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        invoice: true,
        transactions: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);
  return { payments, total };
}

export async function adminRevenueReport(from?: string, to?: string) {
  const where: { completedAt?: { gte?: Date; lte?: Date } } = {};
  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = new Date(from);
    if (to) where.completedAt.lte = new Date(to);
  }

  const payments = await prisma.payment.findMany({
    where: { status: 'COMPLETED', ...where },
    select: { amount: true, gateway: true, completedAt: true, billingNumber: true },
    orderBy: { completedAt: 'desc' },
  });

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const byGateway = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.gateway] = (acc[p.gateway] ?? 0) + p.amount;
    return acc;
  }, {});

  return { totalRevenue, byGateway, count: payments.length, payments };
}
