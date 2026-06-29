import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export async function listCategories(all = false) {
  return prisma.category.findMany({
    where: all ? undefined : { isVisible: true },
    include: { children: { where: all ? undefined : { isVisible: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createCategory(dto: CreateCategoryDto) {
  return prisma.category.create({ data: dto });
}

export async function updateCategory(id: string, dto: UpdateCategoryDto) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');
  return prisma.category.update({ where: { id }, data: dto });
}

export async function deleteCategory(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');
  return prisma.category.update({ where: { id }, data: { isVisible: false } });
}
