import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createProductSchema = z.object({
  vendorId: z.string().cuid().optional(), // required when role=ADMIN, ignored for VENDOR (resolved from JWT)
  categoryId: z.string().cuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  basePrice: z.number().int().positive(),
  sku: z.string().optional(),
  stockQty: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  hasVariants: z.boolean().default(false),
});

// updateProductSchema extends createProductSchema with the status field.
// status is intentionally excluded from createProductSchema (new products
// default to DRAFT via the Prisma schema) but must be patchable via PATCH.
export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
});
export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'ALL']).optional(),
  q: z.string().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryDto = z.infer<typeof productQuerySchema>;

export async function listProducts(query: ProductQueryDto) {
  const { page, limit, categoryId, vendorId, status, q } = query;
  // status omitted or 'ALL' → no status filter (admin/vendor see everything)
  // status = specific value  → filter to that value
  // status omitted AND called from public → callers must pass status='ACTIVE' explicitly
  const statusWhere =
    !status || status === 'ALL'
      ? {}                                                          // no filter — return all statuses
      : { status: status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED' };    // explicit filter

  const where = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(vendorId   ? { vendorId }   : {}),
    ...statusWhere,
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: { select: { businessName: true } }, category: { select: { name: true, slug: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function getProductById(id: string) {
  // Support lookup by slug OR cuid id
  const product = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id }, { slug: id }],
    },
    include: { variants: true, vendor: { select: { businessName: true } }, category: true },
  });
  if (!product) throw AppError.notFound('Product');
  return product;
}

export async function createProduct(dto: CreateProductDto, userId: string, role: Role) {
  const vendor = await resolveVendor(userId, role, dto.vendorId);
  const { vendorId: _v, ...rest } = dto;
  const data: Prisma.ProductUncheckedCreateInput = {
    ...rest,
    vendorId: vendor.id,
    metadata: dto.metadata as Prisma.InputJsonValue | undefined,
  };
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, dto: UpdateProductDto, userId: string, role: Role) {
  const product = await getProductById(id);
  if (role === 'VENDOR') {
    const vendor = await resolveVendor(userId, role);
    if (product.vendorId !== vendor.id) throw AppError.forbidden('You do not own this product');
  }
  const { vendorId: _vendorId, ...rest } = dto;
  const data: Prisma.ProductUncheckedUpdateInput = {
    ...rest,
    metadata: dto.metadata as Prisma.InputJsonValue | undefined,
  };
  if (_vendorId && role === 'ADMIN') data.vendorId = _vendorId;
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string, userId: string, role: Role) {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) throw AppError.notFound('Product');
  // Ownership enforcement — vendor may only soft-delete their own products
  if (role === 'VENDOR') {
    const vendor = await resolveVendor(userId, role);
    if (product.vendorId !== vendor.id) throw AppError.forbidden('You do not own this product');
  }
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
}

async function resolveVendor(userId: string, role: Role, vendorId?: string) {
  if (role === 'ADMIN') {
    if (!vendorId) throw AppError.badRequest('vendorId is required when creating a product as admin');
    const v = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!v) throw AppError.notFound('Vendor');
    return v;
  }
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw AppError.forbidden('No vendor profile found for this user');
  return vendor;
}
