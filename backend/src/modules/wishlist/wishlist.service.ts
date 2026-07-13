import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';

const PRODUCT_SELECT = {
  id: true, name: true, slug: true, basePrice: true,
  images: true, status: true, stockQty: true,
  vendor: { select: { businessName: true } },
  category: { select: { name: true, slug: true } },
} as const;

async function getOrCreate(userId: string) {
  try {
    return await prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: { product: { select: PRODUCT_SELECT } },
        },
      },
    });
  } catch {
    // wishlists table may not exist yet — return empty shell
    return { id: '', userId, createdAt: new Date(), updatedAt: new Date(), items: [] };
  }
}

export async function getWishlist(userId: string) {
  return getOrCreate(userId);
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw AppError.notFound('Product');
  const wishlist = await getOrCreate(userId);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    create: { wishlistId: wishlist.id, productId },
    update: {},
  });
  return getOrCreate(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return;
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
}

export async function clearWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return;
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return false;
  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  return !!item;
}
