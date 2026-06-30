import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';
import { notifyOrderCreated, notifyOrderStatusChanged } from '@/modules/notifications/notifications.service';
import { generateInvoiceForOrder } from '@/modules/billing/billing.service';

export const placeOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

function generateOrderNumber(): string {
  return `NC-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

/** Ensures a Customer row exists for the user — creates it if missing (e.g. role-changed accounts). */
async function ensureCustomer(userId: string) {
  const existing = await prisma.customer.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.customer.create({ data: { userId } });
}

export async function placeOrder(userId: string, dto: PlaceOrderDto) {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: { cart: { include: { items: { include: { product: true, variant: true } } } } },
  });
  if (!customer) throw AppError.forbidden('No customer profile');

  const cart = customer.cart;
  if (!cart || cart.items.length === 0) throw AppError.badRequest('Cart is empty');

  const address = await prisma.address.findFirst({ where: { id: dto.addressId, userId } });
  if (!address) throw AppError.notFound('Address');

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = 0; // will be calculated in delivery module
  const tax = 0;         // will be calculated in tax module
  const total = subtotal + deliveryFee + tax;

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        addressId: dto.addressId,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        subtotal,
        deliveryFee,
        tax,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            vendorId: item.product.vendorId,
            productName: item.product.name,
            variantTitle: item.variant?.title ?? null,
            sku: item.variant?.sku ?? item.product.sku ?? null,
            quantity: item.quantity,
            unitPrice: item.variant?.price ?? item.product.basePrice,
            total: (item.variant?.price ?? item.product.basePrice) * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Clear the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });

  // Fire notification + auto-generate invoice (non-blocking)
  notifyOrderCreated(userId, order.orderNumber, order.id).catch(() => null);
  generateInvoiceForOrder(order.id).catch(() => null);

  return order;
}

export async function getMyOrderById(userId: string, orderId: string) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw AppError.forbidden('No customer profile');

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customer.id, deletedAt: null },
    include: { items: true },
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
      include: { items: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { customerId: customer.id, deletedAt: null } }),
  ]);
  return { orders, total };
}

export async function listVendorOrders(vendorId: string, page: number, limit: number) {
  // Vendor-scoped query — only orders containing items from this vendor
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null, items: { some: { vendorId } } },
      include: { items: { where: { vendorId } } }, // No cross-vendor access — items filtered to this vendor only
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
      include: { items: true, address: true },
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
      include: { customer: { include: { user: { select: { name: true, email: true } } } }, items: true },
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
