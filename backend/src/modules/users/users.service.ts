import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { hashPassword, comparePassword } from '@/shared/utils/hash';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN','VENDOR','CUSTOMER','RIDER']).optional(),
  isActive: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
  notifyUser: z.boolean().optional().default(false),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['ADMIN','VENDOR','CUSTOMER','RIDER']).default('CUSTOMER'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
export type AdminResetPasswordDto = z.infer<typeof adminResetPasswordSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) throw AppError.notFound('User');
  return user;
}

export async function updateMe(userId: string, dto: UpdateProfileDto) {
  if (dto.email) {
    const existing = await prisma.user.findFirst({ where: { email: dto.email, NOT: { id: userId } } });
    if (existing) throw AppError.conflict('Email is already in use');
  }
  return prisma.user.update({ where: { id: userId }, data: dto, select: safeUserSelect });
}

export async function listUsers(page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      select: safeUserSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);
  return { users, total };
}

export async function adminUpdateUser(id: string, dto: AdminUpdateUserDto) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User');

  // Guard against duplicate email before hitting the DB unique constraint
  if (dto.email && dto.email !== user.email) {
    const conflict = await prisma.user.findFirst({ where: { email: dto.email, NOT: { id } } });
    if (conflict) throw AppError.conflict('Email is already in use by another account');
  }

  // Step 1: update the user record
  const updated = await prisma.user.update({
    where: { id },
    data: dto,
    select: safeUserSelect,
  });

  // Step 2: provision role-specific profile based on the NEW role
  const newRole = updated.role;
  try {
    if (newRole === 'VENDOR') {
      const businessName = updated.name || updated.email.split('@')[0] || 'Vendor';
      await prisma.vendor.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id, businessName, isVerified: false, isActive: true },
      });
    } else if (newRole === 'CUSTOMER') {
      await prisma.customer.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    } else if (newRole === 'RIDER') {
      await prisma.rider.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[adminUpdateUser] Profile provisioning failed', { userId: id, newRole, err });
    throw err;
  }

  return updated;
}



export async function adminCreateUser(dto: CreateUserDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw AppError.conflict('Email is already registered');
  const passwordHash = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: { email: dto.email, name: dto.name, phone: dto.phone, passwordHash, role: dto.role as Role },
    select: safeUserSelect,
  });
  // Provision role-specific profile
  if (dto.role === 'CUSTOMER') {
    await prisma.customer.create({ data: { userId: user.id } }).catch(() => null);
  } else if (dto.role === 'VENDOR') {
    const businessName = user.name || user.email.split('@')[0] || 'Vendor';
    await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, businessName, isVerified: false, isActive: true },
    }).catch(() => null);
  } else if (dto.role === 'RIDER') {
    await prisma.rider.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }).catch(() => null);
  }
  return user;
}

export async function changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
  if (!user) throw AppError.notFound('User');
  const valid = await comparePassword(dto.currentPassword, user.passwordHash);
  if (!valid) throw AppError.badRequest('Current password is incorrect');
  const passwordHash = await hashPassword(dto.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function adminResetUserPassword(
  adminId: string,
  targetId: string,
  dto: AdminResetPasswordDto,
) {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, name: true, email: true } });
  if (!target) throw AppError.notFound('User');
  const passwordHash = await hashPassword(dto.newPassword);
  await prisma.user.update({ where: { id: targetId }, data: { passwordHash } });

  // Audit log
  const { audit } = await import('@/shared/utils/audit');
  audit({ userId: adminId, action: 'PASSWORD_RESET_COMPLETED', entity: 'User', entityId: targetId, metadata: { resetBy: adminId } });

  // Optional email notification
  if (dto.notifyUser) {
    const { sendMail } = await import('@/shared/utils/email');
    const { env } = await import('@/config/env');
    await sendMail({
      to: target.email,
      subject: 'Your N_COLE password has been reset',
      html: `<p>Hi ${target.name},</p><p>An administrator has reset your password. <a href="${env.APP_URL}/reset-password">Click here</a> to set a new password, or log in with the new credentials provided to you.</p>`,
    });
  }
}
