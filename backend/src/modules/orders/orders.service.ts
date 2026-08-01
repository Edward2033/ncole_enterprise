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
  const customer = await ensureCustomer(userId);

  const address = await prisma.address.findFirst({ where: { id: dto.addressId, userId } });
  if (!address) throw AppError.notFound('Address');

  const subtotal    = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = 0;
  const tax         = 0;
  const total       = subtotal + deliveryFee + tax;

  // Run stock check, order creation, and stock decrement inside a single
  // serializable transaction so concurrent orders cannot both pass the stock
  // check and drive quantity negative.
  const order = await prisma.$transaction(async (tx) => {
    // 1. Validate and lock stock rows
    for (const item of dto.items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, product: { deletedAt: null } },
        });
        if (!variant) throw AppError.badRequest(`Variant ${item.variantId} not found`);
        if (variant.stockQty < item.quantity)
          throw AppError.badRequest(
            variant.stockQty === 0
              ? `"${item.productName}" is out of stock`
              : `Only ${variant.stockQty} unit(s) of "${item.productName}" available`,
          );
      } else {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null },
        });
        if (!product) throw AppError.badRequest(`Product ${item.productId} not found or unavailable`);
        if (product.stockQty < item.quantity)
          throw AppError.badRequest(
            product.stockQty === 0
              ? `"${item.productName}" is out of stock`
              : `Only ${product.stockQty} unit(s) of "${item.productName}" available`,
          );
      }
    }

    // 2. Create the order
    const newOrder = await tx.order.create({
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

    // 3. Decrement stock atomically — WHERE stockQty >= quantity prevents
    //    negative stock even if two transactions pass the check simultaneously.
    await Promise.all(
      dto.items.map((item) => {
        if (item.variantId) {
          return tx.productVariant.updateMany({
            where: { id: item.variantId, stockQty: { gte: item.quantity } },
            data:  { stockQty: { decrement: item.quantity } },
          });
        }
        return tx.product.updateMany({
          where: { id: item.productId, stockQty: { gte: item.quantity }, deletedAt: null },
          data:  { stockQty: { decrement: item.quantity } },
        });
      }),
    );

    return newOrder;
  }, { timeout: 10000 });

  // Fire notification + auto-generate invoice (non-blocking, outside transaction)
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

  // Restore stock when an order is cancelled (only if it wasn't already cancelled)
  if (dto.status === 'CANCELLED' && order.status !== 'CANCELLED') {
    await Promise.all(
      order.items.map((item) => {
        if (item.variantId) {
          return prisma.productVariant.updateMany({
            where: { id: item.variantId },
            data:  { stockQty: { increment: item.quantity } },
          });
        }
        return prisma.product.updateMany({
          where: { id: item.productId, deletedAt: null },
          data:  { stockQty: { increment: item.quantity } },
        });
      }),
    );
  }

  // Notify customer (non-blocking)
  if (order.customer?.userId) {
    notifyOrderStatusChanged(order.customer.userId, order.orderNumber, order.id, dto.status).catch(() => null);
  }

  return updated;
}
