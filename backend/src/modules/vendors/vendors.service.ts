import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createVendorSchema = z.object({
  userId: z.string().cuid(),
  businessName: z.string().min(2).max(150),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  momoNumber: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.omit({ userId: true }).partial().extend({
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type UpdateVendorDto = z.infer<typeof updateVendorSchema>;

function toVendorApiShape(vendor: any) {
  return {
    ...vendor,
    status: vendor.isActive ? 'ACTIVE' : 'PENDING',
  };
}


export async function listVendors(all = false) {
  const vendors = await prisma.vendor.findMany({
    where: all ? undefined : { isActive: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return vendors.map(toVendorApiShape);
}

export async function getVendorByUserId(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!vendor) throw AppError.notFound('Vendor');
  return toVendorApiShape(vendor);
}

export async function getVendorById(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!vendor) throw AppError.notFound('Vendor');
  return toVendorApiShape(vendor);
}


export async function createVendor(dto: CreateVendorDto) {
  const user = await prisma.user.findUnique({ where: { id: dto.userId } });
  if (!user) throw AppError.notFound('User');
  const existing = await prisma.vendor.findUnique({ where: { userId: dto.userId } });
  if (existing) throw AppError.conflict('User already has a vendor profile');

  const [vendor] = await prisma.$transaction([
    prisma.vendor.create({ data: dto }),
    prisma.user.update({ where: { id: dto.userId }, data: { role: 'VENDOR' } }),
  ]);
  return vendor;
}

export async function updateVendor(id: string, dto: UpdateVendorDto) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw AppError.notFound('Vendor');
  return prisma.vendor.update({
    where: { id },
    data: dto,
    include: { user: { select: { name: true, email: true } } },
  });
}

/** Backfill: create vendor records for any existing users with role=VENDOR that have none. */
export async function backfillVendors() {
  const vendorUsers = await prisma.user.findMany({
    where: { role: 'VENDOR', deletedAt: null },
    select: { id: true, name: true, email: true },
  });
  let created = 0;
  for (const u of vendorUsers) {
    const exists = await prisma.vendor.findUnique({ where: { userId: u.id } });
    if (!exists) {
      const businessName = u.name || u.email.split('@')[0] || 'Vendor';
      await prisma.vendor.create({ data: { userId: u.id, businessName, isVerified: false, isActive: true } });
      created++;
    }
  }
  return { checked: vendorUsers.length, created };
}
