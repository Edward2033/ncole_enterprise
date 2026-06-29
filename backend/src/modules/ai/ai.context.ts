/**
 * AI Context Service
 * Fetches safe, pre-aggregated data snapshots from the DB to inject into
 * Gemini as grounding context. Gemini NEVER touches the DB directly.
 */

import { prisma } from '@/config/database';
import type { AiPortal } from './ai.prompts';

export interface AiContext {
  portal: AiPortal;
  summary: string;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function buildPublicContext(): Promise<string> {
  const [productCount, categories] = await Promise.all([
    prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.category.findMany({
      where: { isVisible: true },
      select: { name: true },
      take: 20,
    }),
  ]);

  return [
    `Platform: N_COLE Interpress — e-commerce marketplace based in Rwanda.`,
    `Active products available: ${productCount}`,
    `Categories: ${categories.map(c => c.name).join(', ')}.`,
    `Currency: All prices in RWF (Rwandan Francs).`,
    `Payment methods: MTN MoMo, Airtel Money, Cash on Delivery.`,
  ].join('\n');
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function buildCustomerContext(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true, address: true },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { payments: { take: 1, orderBy: { createdAt: 'desc' } } },
      },
    },
  });

  if (!customer) return 'No customer profile found.';

  const orderLines = customer.orders.map(o =>
    `  Order ${o.orderNumber}: status=${o.status}, payment=${o.paymentStatus}, total=${o.total} RWF, items=${o.items.length}, created=${o.createdAt.toISOString().slice(0, 10)}`
  ).join('\n') || '  No orders yet.';

  const invoiceLines = customer.invoices.map(inv =>
    `  Invoice ${inv.invoiceNumber}: status=${inv.status}, total=${inv.total} RWF, payment=${inv.payments[0]?.status ?? 'none'}`
  ).join('\n') || '  No invoices yet.';

  return [
    `Customer loyalty points: ${customer.loyaltyPoints}`,
    `Recent orders (last 5):`,
    orderLines,
    `Recent invoices (last 3):`,
    invoiceLines,
  ].join('\n');
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export async function buildVendorContext(userId: string): Promise<string> {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) return 'No vendor profile found.';

  const [totalOrders, totalRevenue, lowStock, topProducts] = await Promise.all([
    prisma.orderItem.count({ where: { vendorId: vendor.id } }),
    prisma.orderItem.aggregate({
      where: { vendorId: vendor.id },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      where: { vendorId: vendor.id, stockQty: { lte: 5 }, status: 'ACTIVE', deletedAt: null },
      select: { name: true, stockQty: true },
      take: 10,
    }),
    prisma.orderItem.groupBy({
      by: ['productName'],
      where: { vendorId: vendor.id },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const lowStockLines = lowStock.map(p => `  ${p.name}: ${p.stockQty} left`).join('\n') || '  None critical.';
  const topProductLines = topProducts.map(p =>
    `  ${p.productName}: ${p._sum.quantity} sold, ${p._sum.total} RWF revenue`
  ).join('\n') || '  No sales yet.';

  return [
    `Vendor: ${vendor.businessName} | Verified: ${vendor.isVerified}`,
    `Total order line items: ${totalOrders}`,
    `Total revenue (all time): ${totalRevenue._sum.total ?? 0} RWF`,
    `Low stock products (≤5 units):`,
    lowStockLines,
    `Top 5 products by revenue:`,
    topProductLines,
  ].join('\n');
}

// ─── Rider ────────────────────────────────────────────────────────────────────

export async function buildRiderContext(userId: string): Promise<string> {
  const rider = await prisma.rider.findUnique({ where: { userId } });
  if (!rider) return 'No rider profile found.';

  const [pending, delivered, outForDelivery] = await Promise.all([
    prisma.order.count({ where: { riderId: rider.id, status: 'READY_FOR_PICKUP' } }),
    prisma.order.count({ where: { riderId: rider.id, status: 'DELIVERED' } }),
    prisma.order.count({ where: { riderId: rider.id, status: 'OUT_FOR_DELIVERY' } }),
  ]);

  return [
    `Rider status: ${rider.status} | Verified: ${rider.isVerified}`,
    `Orders awaiting pickup: ${pending}`,
    `Orders out for delivery: ${outForDelivery}`,
    `Total delivered (all time): ${delivered}`,
  ].join('\n');
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function buildAdminContext(): Promise<string> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders, monthOrders, totalRevenue, monthRevenue,
    totalCustomers, totalVendors, pendingPayments, orderStatusBreakdown,
  ] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.customer.count(),
    prisma.vendor.count({ where: { isVerified: true } }),
    prisma.payment.count({ where: { status: 'SUBMITTED' } }),
    prisma.order.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const statusLines = orderStatusBreakdown
    .map(s => `  ${s.status}: ${s._count.id}`)
    .join('\n');

  return [
    `--- Platform Analytics Snapshot (as of ${now.toISOString().slice(0, 10)}) ---`,
    `Total orders: ${totalOrders} | This month: ${monthOrders}`,
    `Total revenue (completed payments): ${totalRevenue._sum.amount ?? 0} RWF`,
    `Revenue this month: ${monthRevenue._sum.amount ?? 0} RWF`,
    `Total customers: ${totalCustomers} | Verified vendors: ${totalVendors}`,
    `Payments pending verification: ${pendingPayments}`,
    `Order status breakdown:`,
    statusLines,
  ].join('\n');
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function buildContext(portal: AiPortal, userId?: string): Promise<string> {
  switch (portal) {
    case 'PUBLIC':    return buildPublicContext();
    case 'CUSTOMER':  return buildCustomerContext(userId!);
    case 'VENDOR':    return buildVendorContext(userId!);
    case 'RIDER':     return buildRiderContext(userId!);
    case 'ADMIN':     return buildAdminContext();
  }
}
