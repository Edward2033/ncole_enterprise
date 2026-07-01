import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { audit } from '@/shared/utils/audit';
import { hashPassword } from '@/shared/utils/hash';
import { sendMail, approvalEmailHtml } from '@/shared/utils/email';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '@/config/env';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const submitApplicationSchema = z.object({
  role: z.enum(['VENDOR', 'RIDER']),

  // Personal
  fullName:      z.string().min(3).max(120),
  email:         z.string().email(),
  phone:         z.string().min(8).max(20),
  nationalId:    z.string().min(4).max(30),
  dateOfBirth:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  address:       z.string().min(5),
  district:      z.string().min(2),
  province:      z.string().min(2),
  photoUrl:      z.string().url().optional(),

  // Vendor-specific
  businessName:    z.string().min(2).max(150).optional(),
  businessType:    z.string().min(2).max(80).optional(),
  businessAddress: z.string().min(5).optional(),
  momoNumber:      z.string().min(8).max(20).optional(),
  yearsInBusiness: z.coerce.number().int().min(0).max(100).optional(),
  description:     z.string().max(1000).optional(),

  // Rider-specific
  vehicleType:   z.string().min(2).max(60).optional(),
  plateNumber:   z.string().min(2).max(20).optional(),
  licenseNumber: z.string().min(4).max(30).optional(),
  deliveryZone:  z.string().min(2).max(100).optional(),
  experience:    z.string().max(500).optional(),

  // Emergency contact
  emergencyName:  z.string().min(3).max(120),
  emergencyPhone: z.string().min(8).max(20),
}).superRefine((data, ctx) => {
  if (data.role === 'VENDOR') {
    if (!data.businessName)    ctx.addIssue({ code: 'custom', path: ['businessName'],    message: 'Business name is required for vendors' });
    if (!data.businessType)    ctx.addIssue({ code: 'custom', path: ['businessType'],    message: 'Business type is required for vendors' });
    if (!data.businessAddress) ctx.addIssue({ code: 'custom', path: ['businessAddress'], message: 'Business address is required for vendors' });
    if (!data.momoNumber)      ctx.addIssue({ code: 'custom', path: ['momoNumber'],      message: 'MoMo number is required for vendors' });
  }
  if (data.role === 'RIDER') {
    if (!data.vehicleType)   ctx.addIssue({ code: 'custom', path: ['vehicleType'],   message: 'Vehicle type is required for riders' });
    if (!data.plateNumber)   ctx.addIssue({ code: 'custom', path: ['plateNumber'],   message: 'Plate number is required for riders' });
    if (!data.licenseNumber) ctx.addIssue({ code: 'custom', path: ['licenseNumber'], message: 'License number is required for riders' });
    if (!data.deliveryZone)  ctx.addIssue({ code: 'custom', path: ['deliveryZone'],  message: 'Delivery zone is required for riders' });
  }
});

export const reviewApplicationSchema = z.object({
  action:     z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().max(500).optional(),
});

export type SubmitApplicationDto = z.infer<typeof submitApplicationSchema>;
export type ReviewApplicationDto = z.infer<typeof reviewApplicationSchema>;

// ─── Service functions ────────────────────────────────────────────────────────

export async function submitApplication(dto: SubmitApplicationDto, ipAddress?: string) {
  const pending = await prisma.application.findFirst({
    where: { email: dto.email, status: 'PENDING' },
  });
  if (pending) throw AppError.conflict('An application from this email is already under review');

  const app = await prisma.application.create({
    data: {
      ...dto,
      dateOfBirth: new Date(dto.dateOfBirth),
      status: 'PENDING',
    },
  });

  audit({
    action: 'APPLICATION_SUBMITTED',
    entity: 'Application',
    entityId: app.id,
    ipAddress,
    metadata: { email: dto.email, role: dto.role },
  });

  return app;
}

export async function listApplications(status?: string, role?: string) {
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where['status'] = status;
  if (role   && role   !== 'ALL') where['role']   = role;

  return prisma.application.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getApplication(id: string) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw AppError.notFound('Application');
  return app;
}

export async function reviewApplication(
  id: string,
  dto: ReviewApplicationDto,
  adminId: string,
) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw AppError.notFound('Application');
  if (app.status !== 'PENDING') throw AppError.conflict('Application has already been reviewed');

  if (dto.action === 'REJECT') {
    const updated = await prisma.application.update({
      where: { id },
      data: {
        status:     'REJECTED',
        reviewedBy: adminId,
        reviewNote: dto.reviewNote ?? null,
        reviewedAt: new Date(),
      },
    });
    audit({ userId: adminId, action: 'APPLICATION_REJECTED', entity: 'Application', entityId: id });
    return updated;
  }

  // ── APPROVE ──────────────────────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: app.email } });
  let userId: string;
  let tempPassword = '';

  if (existingUser) {
    // Account already exists — reuse it (handles re-approval / duplicate submissions)
    userId = existingUser.id;
  } else {
    tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword);
    const created = await prisma.user.create({
      data: {
        email:        app.email,
        name:         app.fullName,
        phone:        app.phone,
        passwordHash,
        role:         app.role as 'VENDOR' | 'RIDER',
        isActive:     true,
      },
    });
    userId = created.id;
    // Provision Customer profile so the user can also shop
    await prisma.customer.create({ data: { userId } });
  }

  if (app.role === 'VENDOR') {
    const vendorExists = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendorExists) {
      await prisma.vendor.create({
        data: {
          userId,
          businessName: app.businessName!,
          description: app.description ?? null,
          logoUrl:     app.photoUrl ?? null,
          momoNumber:  app.momoNumber ?? null,
          isVerified:  true,
          isActive:    true,
        },
      });
    }
  } else {
    const riderExists = await prisma.rider.findUnique({ where: { userId } });
    if (!riderExists) {
      await prisma.rider.create({
        data: {
          userId,
          vehicleType: app.vehicleType ?? null,
          plateNumber: app.plateNumber ?? null,
          isVerified:  true,
          status:      'OFFLINE',
        },
      });
    }
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status:     'APPROVED',
      reviewedBy: adminId,
      reviewNote: dto.reviewNote ?? null,
      reviewedAt: new Date(),
      userId,
    },
  });

  audit({
    userId: adminId,
    action: 'APPLICATION_APPROVED',
    entity: 'Application',
    entityId: id,
    metadata: { newUserId: userId },
  });

  // Generate 72-hour password-set token (only for newly created accounts)
  if (tempPassword) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: { token: resetToken, userId, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
    });

    await sendMail({
      to:      app.email,
      subject: `Welcome to N_COLE Interpress — Your ${app.role === 'VENDOR' ? 'Vendor' : 'Rider'} account is ready`,
      html:    approvalEmailHtml({
        name:           app.fullName,
        role:           app.role as 'VENDOR' | 'RIDER',
        email:          app.email,
        tempPassword,
        setPasswordUrl: `${env.APP_URL}/reset-password?token=${resetToken}`,
        loginUrl:       `${env.APP_URL}/login`,
      }),
    });
  }

  return updated;
}

/** Admin creates an application and immediately approves it (direct onboard) */
export async function adminDirectApply(
  dto: SubmitApplicationDto,
  adminId: string,
  autoApprove = false,
) {
  const app = await submitApplication(dto);
  if (autoApprove) {
    return reviewApplication(app.id, { action: 'APPROVE', reviewNote: 'Directly onboarded by admin' }, adminId);
  }
  return app;
}
