/**
 * Email utility — Resend SDK.
 * sendMail never throws — email failures must never crash auth flows.
 * verifyTransport logs clearly at startup so misconfiguration is visible immediately.
 */
import { Resend } from 'resend';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

let _resend: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

/** Resolve the correct from address.
 *  - Production: EMAIL_FROM env var (must be a verified Resend domain).
 *  - Development / no key: onboarding@resend.dev (Resend sandbox, no domain needed).
 */
function resolveFrom(): string {
  if (env.RESEND_API_KEY && env.NODE_ENV === 'production') {
    return env.EMAIL_FROM;
  }
  // Dev or missing key — use Resend sandbox sender so test sends still work
  return env.NODE_ENV === 'production'
    ? env.EMAIL_FROM
    : 'N_COLE Interpress <onboarding@resend.dev>';
}

/**
 * Call once at server startup.
 * Logs confirmation or a clear warning — never throws, never blocks startup.
 */
export function verifyTransport(): void {
  if (!env.RESEND_API_KEY) {
    logger.warn(
      '[EMAIL] RESEND_API_KEY is not set — emails will be logged to console only. ' +
      'Add RESEND_API_KEY to Render environment variables to enable delivery.',
    );
    return;
  }
  logger.info(
    `[EMAIL] Email service initialized with Resend | from: ${env.EMAIL_FROM} | reply-to: ${env.EMAIL_REPLY_TO}`,
  );
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const client = getClient();
  const from   = resolveFrom();

  if (!client) {
    logger.warn(`[EMAIL-DEV] No RESEND_API_KEY — email NOT delivered | to: ${opts.to} | subject: ${opts.subject}`);
    logger.info(`[EMAIL-DEV] Preview: ${opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)}`);
    return;
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to:       opts.to,
      subject:  opts.subject,
      html:     opts.html,
      replyTo:  env.EMAIL_REPLY_TO,
    });

    if (error) {
      logger.error('[EMAIL] Resend rejected the request', {
        from,
        to:      opts.to,
        subject: opts.subject,
        code:    (error as { statusCode?: number }).statusCode,
        message: (error as { message?: string }).message,
      });
      return;
    }

    logger.info(`[EMAIL] Delivered | id: ${data?.id} | from: ${from} | to: ${opts.to} | subject: ${opts.subject}`);
  } catch (err) {
    logger.error('[EMAIL] Unexpected error', {
      from,
      to:      opts.to,
      subject: opts.subject,
      err,
    });
  }
}

export interface ApprovalEmailOptions {
  name: string;
  role: 'VENDOR' | 'RIDER';
  email: string;
  tempPassword: string;
  setPasswordUrl: string;
  loginUrl: string;
}

export function approvalEmailHtml(opts: ApprovalEmailOptions): string {
  const year     = new Date().getFullYear();
  const roleLabel = opts.role === 'VENDOR' ? 'Vendor' : 'Rider';
  const dashPath  = opts.role === 'VENDOR' ? '/vendor/dashboard' : '/rider/dashboard';
  const dashUrl   = `${opts.loginUrl.replace('/login', '')}${dashPath}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr><td style="background:#f97316;padding:28px 40px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">N_COLE Interpress</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px;">🎉 Your ${roleLabel} Account is Approved</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi <strong>${opts.name}</strong>,</p>
          <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7;">
            Congratulations! Your application to join N_COLE Interpress as a <strong>${roleLabel}</strong> has been <span style="color:#16a34a;font-weight:600;">approved</span>.
            Your account has been created and is ready to use.
          </p>

          <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;">Your Login Credentials</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0;">Email</td>
                <td style="color:#0f172a;font-size:13px;font-weight:500;text-align:right;">${opts.email}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0;">Temporary Password</td>
                <td style="font-family:monospace;color:#f97316;font-size:14px;font-weight:700;text-align:right;letter-spacing:0.05em;">${opts.tempPassword}</td>
              </tr>
            </table>
          </div>

          <p style="margin:0 0 16px;color:#475569;font-size:13px;line-height:1.7;">
            For security, we strongly recommend setting a permanent password before you log in.
            Click the button below — this link expires in <strong>72 hours</strong>.
          </p>

          <a href="${opts.setPasswordUrl}"
            style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                   padding:14px 32px;border-radius:50px;font-size:15px;font-weight:600;margin-bottom:12px;">
            Set My Password
          </a>

          <p style="margin:16px 0 0;color:#64748b;font-size:13px;">
            Or <a href="${opts.loginUrl}" style="color:#f97316;">log in directly</a> using the temporary password above,
            then go to your ${roleLabel} dashboard:
            <a href="${dashUrl}" style="color:#f97316;display:block;margin-top:4px;">${dashUrl}</a>
          </p>

          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
            After logging in you will be asked to verify your identity with a one-time code sent to this email.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} N_COLE Interpress. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function otpEmailHtml(name: string, code: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr><td style="background:#f97316;padding:28px 40px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">N_COLE Interpress</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Login Verification Code</p>
        </td></tr>
        <tr><td style="padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;color:#0f172a;font-size:16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
            Use the code below to complete your login. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="display:inline-block;background:#fff7ed;border:2px solid #f97316;border-radius:16px;padding:20px 40px;margin-bottom:24px;">
            <span style="font-family:monospace;font-size:40px;font-weight:800;letter-spacing:0.2em;color:#f97316;">${code}</span>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;">If you did not attempt to log in, please ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} N_COLE Interpress. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailHtml(name: string, resetUrl: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr><td style="background:#f97316;padding:28px 40px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">N_COLE Interpress</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Password Reset</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
            We received a request to reset your N_COLE Interpress password.
            Click the button below to choose a new password.
            This link expires in <strong>1 hour</strong> and can only be used once.
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                   padding:14px 32px;border-radius:50px;font-size:15px;font-weight:600;">
            Reset My Password
          </a>
          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">
            &copy; ${year} N_COLE Interpress. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
