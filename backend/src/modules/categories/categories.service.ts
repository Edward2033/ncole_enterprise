import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name:        z.string().min(1).max(100),
  slug:        z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  parentId:    z.string().cuid().optional(),
  sortOrder:   z.number().int().default(0),
  isVisible:   z.boolean().optional(),
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
  // Duplicate name check
  const nameExists = await prisma.category.findFirst({ where: { name: { equals: dto.name, mode: 'insensitive' } } });
  if (nameExists) throw AppError.conflict('A category with this name already exists');

  // Duplicate slug check
  const slugExists = await prisma.category.findUnique({ where: { slug: dto.slug } });
  if (slugExists) throw AppError.conflict('A category with this slug already exists');

  return prisma.category.create({ data: dto });
}

export async function updateCategory(id: string, dto: UpdateCategoryDto) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');

  // Duplicate name check (exclude self)
  if (dto.name) {
    const nameExists = await prisma.category.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' }, id: { not: id } },
    });
    if (nameExists) throw AppError.conflict('A category with this name already exists');
  }

  // Duplicate slug check (exclude self)
  if (dto.slug) {
    const slugExists = await prisma.category.findFirst({
      where: { slug: dto.slug, id: { not: id } },
    });
    if (slugExists) throw AppError.conflict('A category with this slug already exists');
  }

  return prisma.category.update({ where: { id }, data: dto });
}

export async function deleteCategory(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');
  return prisma.category.update({ where: { id }, data: { isVisible: false } });
}

// ─── Default category seed ────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  'Printing Services', 'Branding & Signage', 'Graphic Design', 'Custom Apparel',
  'Packaging', 'Office Supplies', 'Bookstore', 'Fashion Store', 'Electronics Shop',
  'Pharmacy', 'Restaurant Ordering System', 'Grocery Store',
  'Handicraft Marketplace', 'Beauty & Cosmetics Store', 'Agricultural Products Marketplace',
];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function seedDefaultCategories(): Promise<{ created: number; skipped: number }> {
  // Find the current max sortOrder so we continue sequentially
  const maxRow = await prisma.category.aggregate({ _max: { sortOrder: true } });
  let nextOrder = (maxRow._max.sortOrder ?? -1) + 1;

  let created = 0;
  let skipped = 0;

  for (const name of DEFAULT_CATEGORIES) {
    const slug = toSlug(name);
    const exists = await prisma.category.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
    });
    if (exists) { skipped++; continue; }
    await prisma.category.create({
      data: { name, slug, isVisible: true, sortOrder: nextOrder++ },
    });
    created++;
  }

  return { created, skipped };
}
