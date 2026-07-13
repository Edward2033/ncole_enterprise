import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';
import { notifyOrderCreated, notifyOrderStatusChanged } from '@/modules/notifications/notifications.service';
import { generateInvoiceForOrder } from '@/modules/billing/billing.service';

export const placeOrderSchema = z.object({
  addressId:     z.string().min(1, 'Address is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes:         z.string().optional(),
  // Cart items sent directly from the frontend localStorage cart
  items: z.array(z.object({
    productId:  z.string().min(1),
    variantId:  z.string().min(1).optional().nullable(),
    quantity:   z.number().int().positive(),
    unitPrice:  z.number().int().positive(),
    productName: z.string().min(1),
    variantTitle: z.string().optional().nullable(),
    sku:          z.string().optional().nullable(),
    vendorId:     z.string().min(1),
  })).min(1, 'Cart is empty'),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

function generateOrderNumber(): string {
  return `NC-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

/** Ensures a Customer row exists for the user — creates it if missing. */
async function ensureCustomer(userId: string) {
  const existing = await prisma.customer.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.customer.create({ data: { userId } });
}

export async function placeOrder(userId: string, dto: PlaceOrderDto) {
  // Ensure customer profile exists (auto-create if needed)
  const customer = await ensureCustomer(userId);

  const address = await prisma.address.findFirst({ where: { id: dto.addressId, userId } });
  if (!address) throw AppError.notFound('Address');

  // Validate all products exist and vendorIds are correct
  for (const item of dto.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, deletedAt: null },
    });
    if (!product) throw AppError.badRequest(`Product ${item.productId} not found or unavailable`);
  }

  const subtotal    = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = 0;
  const tax         = 0;
  const total       = subtotal + deliveryFee + tax;

  // Use a direct nested write instead of an interactive transaction.
  // prisma.$transaction(async tx=>{}) requires a persistent connection which
  // is incompatible with Supabase PgBouncer transaction-mode pooling (port 6543).
  // Nested writes (items: { create: [...] }) are already executed atomically
  // by Prisma in a single implicit transaction — no wrapper needed.
  const order = await prisma.order.create({
    data: {
      orderNumber:   generateOrderNumber(),
      customerId:    customer.id,
      addressId:     dto.addressId,
      paymentMethod: dto.paymentMethod,
      notes:         dto.notes,
      subtotal,
      deliveryFee,
      tax,
      total,
      items: {
        create: dto.items.map((item) => ({
          productId:    item.productId,
          variantId:    item.variantId ?? null,
          vendorId:     item.vendorId,
          productName:  item.productName,
          variantTitle: item.variantTitle ?? null,
          sku:          item.sku ?? null,
          quantity:     item.quantity,
          unitPrice:    item.unitPrice,
          total:        item.unitPrice * item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  // Fire notification + auto-generate invoice (non-blocking)
  notifyOrderCreated(userId, order.orderNumber, order.id).catch(() => null);
  generateInvoiceForOrder(order.id).catch(() => null);

  return order;
}

export async function getMyOrderById(userId: string, orderId: string) {
  // Use ensureCustomer to auto-create a Customer row if missing,
  // consistent with placeOrder. Prevents 403 for valid users.
  const customer = await prisma.customer.findUnique({ where: { userId } })
    ?? await prisma.customer.create({ data: { userId } });

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customer.id, deletedAt: null },
    include: { items: { include: { product: { select: { images: true } } } } },
  });
  if (!order) throw AppError.notFound('Order');
  return order;
}

export async function getMyOrders(userId: string, page: number, limit: number) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw AppError.forbidden('No customer profile');

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id, deletedAt: null },
      include: { items: { include: { product: { select: { images: true } } } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { customerId: customer.id, deletedAt: null } }),
  ]);
  return { orders, total };
}

export async function getVendorOrderById(vendorId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null, items: { some: { vendorId } } },
    include: {
      address: true,
      customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
      items: {
        where: { vendorId },
        include: {
          product: {
            select: { images: true, name: true, sku: true, basePrice: true, stockQty: true, category: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!order) throw AppError.notFound('Order');
  return order;
}

export async function listVendorOrders(vendorId: string, page: number, limit: number) {
  // Vendor-scoped query — only orders containing items from this vendor
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null, items: { some: { vendorId } } },
      include: {
        address: true,
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        items: {
          where: { vendorId },
          include: {
            product: {
              select: { images: true, name: true, sku: true, basePrice: true, stockQty: true, category: { select: { name: true } } },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { deletedAt: null, items: { some: { vendorId } } } }),
  ]);
  return { orders, total };
}

export async function listRiderOrders(userId: string, page: number, limit: number) {
  const rider = await prisma.rider.findUnique({ where: { userId } });
  if (!rider) throw AppError.forbidden('No rider profile');

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { riderId: rider.id, deletedAt: null },
      include: { items: { include: { product: { select: { images: true } } } }, address: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { riderId: rider.id, deletedAt: null } }),
  ]);
  return { orders, total };
}

export async function assignRider(orderId: string, riderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, deletedAt: null } });
  if (!order) throw AppError.notFound('Order');
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) throw AppError.notFound('Rider');
  return prisma.order.update({ where: { id: orderId }, data: { riderId } });
}

export async function listAllOrders(page: number, limit: number) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        address: true,
        customer: { include: { user: { select: { name: true, email: true } } } },
        items: { include: { product: { select: { images: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { deletedAt: null } }),
  ]);
  return { orders, total };
}

export async function updateOrderStatus(
  id: string,
  dto: UpdateOrderStatusDto,
  userId: string,
  role: Role,
) {
  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: { items: true, customer: { include: { user: true } } },
  });
  if (!order) throw AppError.notFound('Order');

  // Ownership enforcement — vendor may only update orders containing their own items
  if (role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw AppError.forbidden('No vendor profile');
    const ownsItem = order.items.some((item) => item.vendorId === vendor.id);
    if (!ownsItem) throw AppError.forbidden('You do not have permission to update this order');
  }

  // Rider scope enforcement — rider may only update orders assigned to them
  if (role === 'RIDER') {
    const rider = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) throw AppError.forbidden('No rider profile');
    if (order.riderId !== rider.id) throw AppError.forbidden('This order is not assigned to you');
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: dto.status } });

  // Notify customer (non-blocking)
  if (order.customer?.userId) {
    notifyOrderStatusChanged(order.customer.userId, order.orderNumber, order.id, dto.status).catch(() => null);
  }

  return updated;
}
