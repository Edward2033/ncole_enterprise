import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { hashPassword, comparePassword } from '@/shared/utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type TokenPayload } from '@/shared/utils/jwt';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.schema';
import { env } from '@/config/env';
import { audit } from '@/shared/utils/audit';
import { sendMail, passwordResetEmailHtml } from '@/shared/utils/email';
import { sendOtp, verifyOtp } from '@/modules/otp/otp.service';
import crypto from 'crypto';

/** Parse simple duration string like "7d", "15m", "1h" into milliseconds. */
function parseDurationMs(str: string): number {
  const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  return parseInt(match[1]!, 10) * (units[match[2]!] ?? 0);
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN));
}

export async function registerUser(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw AppError.conflict('Email is already registered');

  const passwordHash = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: { email: dto.email, name: dto.name, phone: dto.phone, passwordHash, role: 'CUSTOMER' },
    select: { id: true, email: true, name: true, role: true },
  });

  // Provision customer profile automatically
  await prisma.customer.create({ data: { userId: user.id } });

  audit({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

  return issueTokens(user.id, user.email, user.role);
}

export async function loginUser(dto: LoginDto) {
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, isActive: true, deletedAt: true },
  });

  if (!user || user.deletedAt) throw AppError.unauthorized('Invalid credentials');
  if (!user.isActive) throw AppError.forbidden('Account is deactivated');

  const valid = await comparePassword(dto.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid credentials');

  audit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

  // VENDOR and RIDER require OTP verification before tokens are issued
  // CUSTOMER and ADMIN log in directly — no OTP required
  if (user.role === 'VENDOR' || user.role === 'RIDER') {
    await sendOtp(user.id, user.email, user.name);
    return { requiresOtp: true, userId: user.id };
  }

  return issueTokens(user.id, user.email, user.role);
}

/** Called after OTP is verified — issues tokens for VENDOR / RIDER */
export async function loginVerifyOtp(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
  });
  if (!user || user.deletedAt || !user.isActive) throw AppError.unauthorized('Invalid session');

  await verifyOtp(userId, code);
  return issueTokens(user.id, user.email, user.role);
}

export async function refreshTokens(rawToken: string) {
  // Wrap JWT verification so an invalid/malformed token returns 401, not 500
  let payload: Pick<TokenPayload, 'sub'>;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw AppError.unauthorized('Refresh token is invalid or expired');
  }

  // Wrap all DB operations so a Prisma/PgBouncer error returns 401, not 500
  let stored: Awaited<ReturnType<typeof prisma.refreshToken.findUnique>> & {
    user: { id: string; email: string; role: string; isActive: boolean };
  } | null;

  try {
    stored = await prisma.refreshToken.findUnique({
      where: { token: rawToken },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    }) as typeof stored;
  } catch {
    throw AppError.unauthorized('Refresh token is invalid or expired');
  }

  if (!stored || stored.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token is invalid or expired');
  }
  if (!stored.user.isActive) throw AppError.forbidden('Account is deactivated');

  // Token rotation — delete old, issue new
  try {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return issueTokens(payload.sub, stored.user.email, stored.user.role);
  } catch {
    throw AppError.unauthorized('Refresh token is invalid or expired');
  }
}

export async function logoutUser(rawToken: string) {
  // Delete by token value only — no userId needed, avoids requiring a valid access token
  await prisma.refreshToken.deleteMany({ where: { token: rawToken } });
}

export async function forgotPassword(dto: ForgotPasswordDto): Promise<void> {
  // Always respond success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
    select: { id: true, name: true, email: true, isActive: true, deletedAt: true },
  });

  if (!user || user.deletedAt || !user.isActive) return;

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your Ncole Interpress password',
    html: passwordResetEmailHtml(user.name, resetUrl),
  });

  audit({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', entity: 'User', entityId: user.id });
}

export async function resetPassword(dto: ResetPasswordDto): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: dto.token },
    include: { user: { select: { id: true, isActive: true, deletedAt: true } } },
  });

  if (!record) throw AppError.badRequest('Invalid or expired reset link');
  if (record.usedAt) throw AppError.badRequest('This reset link has already been used');
  if (record.expiresAt < new Date()) throw AppError.badRequest('This reset link has expired');
  if (!record.user.isActive || record.user.deletedAt) throw AppError.forbidden('Account is deactivated');

  const passwordHash = await hashPassword(dto.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate all existing refresh tokens for security
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  audit({ userId: record.userId, action: 'PASSWORD_RESET_COMPLETED', entity: 'User', entityId: record.userId });
}

async function issueTokens(userId: string, email: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt: refreshTokenExpiry() },
  });

  return { accessToken, refreshToken };
}
