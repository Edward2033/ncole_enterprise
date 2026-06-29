/**
 * Audit Service — fire-and-forget activity logging.
 * Never throws — logging must never break business flows.
 */
import { prisma } from '@/config/database';
import { type Prisma, AuditAction } from '@prisma/client';
import { logger } from '@/config/logger';

export interface AuditEntry {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

export function audit(entry: AuditEntry): void {
  prisma.activityLog.create({ data: entry as Prisma.ActivityLogCreateInput }).catch((err) => {
    logger.error('Audit log failed', { err, entry });
  });
}
