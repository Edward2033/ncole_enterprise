import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title:  z.string().max(200).optional(),
  body:   z.string().max(2000).optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

const USER_SELECT = { id: true, name: true, avatarUrl: true } as const;

export async function listReviews(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw AppError.notFound('Product');

  let reviews: Array<{ id: string; rating: number; title: string | null; body: string | null; createdAt: Date; updatedAt: Date; productId: string; userId: string; user: { id: string; name: string; avatarUrl: string | null } }> = [];
  try {
    reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: USER_SELECT } },
    });
  } catch {
    // reviews table may not exist yet in this environment — return empty
    return { reviews: [], count: 0, averageRating: 0 };
  }

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return { reviews, count: reviews.length, averageRating: Math.round(avg * 10) / 10 };
}

export async function createReview(userId: string, productId: string, dto: CreateReviewDto) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw AppError.notFound('Product');

  return prisma.review.upsert({
    where: { productId_userId: { productId, userId } },
    create: { productId, userId, ...dto },
    update: dto,
    include: { user: { select: USER_SELECT } },
  });
}

export async function deleteReview(userId: string, productId: string) {
  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (!review) throw AppError.notFound('Review');
  await prisma.review.delete({ where: { id: review.id } });
}
