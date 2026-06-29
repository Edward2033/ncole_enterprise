import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

async function getOrCreateCart(userId: string) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw AppError.forbidden('No customer profile');

  return prisma.cart.upsert({
    where: { customerId: customer.id },
    create: { customerId: customer.id },
    update: {},
    include: { items: { include: { product: true, variant: true } } },
  });
}

export async function getCart(userId: string) {
  return getOrCreateCart(userId);
}

export async function addItem(userId: string, dto: AddCartItemDto) {
  const cart = await getOrCreateCart(userId);

  const existing = cart.items.find(
    (i) => i.productId === dto.productId && i.variantId === (dto.variantId ?? null),
  );

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + dto.quantity },
    });
  }

  return prisma.cartItem.create({ data: { cartId: cart.id, ...dto } });
}

export async function updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw AppError.notFound('Cart item');
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw AppError.notFound('Cart item');
  return prisma.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
