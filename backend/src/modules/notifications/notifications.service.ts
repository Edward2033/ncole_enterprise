import { prisma } from '@/config/database';
import { AppError } from '@/shared/errors/AppError';
import { type Prisma, NotificationType, NotificationChannel } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Prisma.InputJsonValue;
}

export interface BroadcastNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  userIds?: string[];      // if empty, broadcast to all active users
  metadata?: Prisma.InputJsonValue;
}

// ─── Create single notification ───────────────────────────────────────────────
export async function createNotification(dto: CreateNotificationDto) {
  return prisma.notification.create({
    data: {
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      channel: dto.channel ?? 'IN_APP',
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

// ─── Get notifications for user ───────────────────────────────────────────────
export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ─── Unread count ─────────────────────────────────────────────────────────────
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

// ─── Mark single notification read ────────────────────────────────────────────
export async function markNotificationRead(id: string, userId: string) {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw AppError.notFound('Notification');
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

// ─── Mark all read for user ────────────────────────────────────────────────────
export async function markAllRead(userId: string) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { count };
}

// ─── Delete notification ───────────────────────────────────────────────────────
export async function deleteNotification(id: string, userId: string) {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw AppError.notFound('Notification');
  return prisma.notification.delete({ where: { id } });
}

// ─── Admin broadcast ──────────────────────────────────────────────────────────
export async function broadcastNotification(dto: BroadcastNotificationDto) {
  let targetIds = dto.userIds ?? [];

  if (targetIds.length === 0) {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    targetIds = users.map(u => u.id);
  }

  // Batch create — Prisma createMany is faster than individual creates
  const result = await prisma.notification.createMany({
    data: targetIds.map(userId => ({
      userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      channel: 'IN_APP' as NotificationChannel,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    })),
  });

  return { sent: result.count };
}

// ─── Get / upsert preferences ─────────────────────────────────────────────────
export async function getPreferences(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function updatePreferences(
  userId: string,
  data: { inApp?: boolean; email?: boolean; orderUpdates?: boolean; promotions?: boolean },
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

// ─── Event-driven helpers (called by other modules) ──────────────────────────
export async function notifyOrderCreated(userId: string, orderNumber: string, orderId: string) {
  return createNotification({
    userId, type: 'ORDER_CREATED',
    title: 'Order Placed',
    message: `Your order ${orderNumber} has been placed successfully.`,
    metadata: { orderId },
  });
}

export async function notifyOrderStatusChanged(
  userId: string, orderNumber: string, orderId: string, status: string,
) {
  const messages: Record<string, { title: string; message: string; type: NotificationType }> = {
    CONFIRMED:        { type: 'ORDER_CONFIRMED', title: 'Order Confirmed', message: `${orderNumber} has been confirmed by the vendor.` },
    OUT_FOR_DELIVERY: { type: 'ORDER_SHIPPED',   title: 'Out for Delivery', message: `${orderNumber} is on its way to you.` },
    DELIVERED:        { type: 'ORDER_DELIVERED', title: 'Order Delivered', message: `${orderNumber} has been delivered. Enjoy!` },
    CANCELLED:        { type: 'ORDER_CANCELLED', title: 'Order Cancelled', message: `${orderNumber} has been cancelled.` },
  };
  const template = messages[status];
  if (!template) return;
  return createNotification({ userId, ...template, metadata: { orderId } });
}

export async function notifyVendorApproval(userId: string, approved: boolean) {
  return createNotification({
    userId, type: 'VENDOR_APPROVAL',
    title: approved ? 'Vendor Account Approved' : 'Vendor Application Update',
    message: approved
      ? 'Congratulations! Your vendor account has been approved. You can now list products.'
      : 'Your vendor application requires further review. Please contact support.',
  });
}

export async function notifyRiderAssignment(riderId: string, orderNumber: string, orderId: string) {
  return createNotification({
    userId: riderId, type: 'RIDER_ASSIGNMENT',
    title: 'New Delivery Assigned',
    message: `Order ${orderNumber} has been assigned to you for delivery.`,
    metadata: { orderId },
  });
}
