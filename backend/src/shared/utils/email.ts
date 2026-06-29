/**
 * Email utility — nodemailer v9 compatible.
 * Uses SMTP when SMTP_HOST is configured; logs to console in dev.
 * Never throws — email failures must never break auth flows.
 */
import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

let _transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!env.SMTP_HOST) return null;
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return _transport;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const from = env.SMTP_FROM ?? 'N_COLE Interpress <noreply@ncoleinterpress.com>';
  try {
    const transport = getTransport();
    if (!transport) {
      logger.info(`[EMAIL-DEV] To: ${opts.to} | Subject: ${opts.subject}`);
      logger.info(`[EMAIL-DEV] ${opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)}`);
      return;
    }
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
    logger.info(`Email sent to ${opts.to}: ${opts.subject}`);
  } catch (err) {
    logger.error('Failed to send email', { err, to: opts.to, subject: opts.subject });
  }
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
