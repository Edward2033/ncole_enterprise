import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(9).max(20),
  street: z.string().min(1).max(200),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  country: z.string().default('Rwanda'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
}

export async function createAddress(userId: string, dto: CreateAddressDto) {
  if (dto.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...dto, userId } });
}

export async function updateAddress(id: string, userId: string, dto: UpdateAddressDto) {
  const addr = await prisma.address.findFirst({ where: { id, userId } });
  if (!addr) throw AppError.notFound('Address');
  if (dto.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id }, data: dto });
}

export async function deleteAddress(id: string, userId: string) {
  const addr = await prisma.address.findFirst({ where: { id, userId } });
  if (!addr) throw AppError.notFound('Address');
  return prisma.address.delete({ where: { id } });
}
