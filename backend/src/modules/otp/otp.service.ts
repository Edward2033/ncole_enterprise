import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { audit } from '@/shared/utils/audit';
import { sendMail, otpEmailHtml } from '@/shared/utils/email';
import crypto from 'crypto';

/** Generate a 6-digit numeric OTP, store it, and email it to the user. */
export async function sendOtp(userId: string, email: string, name: string): Promise<void> {
  // Invalidate any existing unused OTPs for this user
  await prisma.otpCode.deleteMany({ where: { userId, usedAt: null } });

  const code      = String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, '0');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpCode.create({ data: { userId, code, expiresAt } });

  await sendMail({
    to:      email,
    subject: 'Your N_COLE Interpress login verification code',
    html:    otpEmailHtml(name, code),
  });

  audit({ userId, action: 'OTP_SENT', entity: 'User', entityId: userId });
}

/** Verify OTP — marks it used and returns true on success. */
export async function verifyOtp(userId: string, code: string): Promise<void> {
  const record = await prisma.otpCode.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record)                      throw AppError.unauthorized('No active OTP found. Please request a new one.');
  if (record.expiresAt < new Date()) throw AppError.unauthorized('OTP has expired. Please request a new one.');
  if (record.code !== code)          throw AppError.unauthorized('Invalid OTP code.');

  await prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  audit({ userId, action: 'OTP_VERIFIED', entity: 'User', entityId: userId });
}
