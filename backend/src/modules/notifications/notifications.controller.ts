import { Request, Response, NextFunction } from 'express';
import {
  getNotificationsForUser, getUnreadCount, markNotificationRead,
  markAllRead, deleteNotification, broadcastNotification,
  getPreferences, updatePreferences, BroadcastNotificationDto,
} from './notifications.service';
import { sendSuccess } from '@/shared/utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [items, unread] = await Promise.all([
      getNotificationsForUser(req.user!.sub),
      getUnreadCount(req.user!.sub),
    ]);
    sendSuccess(res, items, 200, { unread } as never);
  } catch (e) { next(e); }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await markNotificationRead(req.params['id']!, req.user!.sub));
  } catch (e) { next(e); }
}

export async function markAllReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await markAllRead(req.user!.sub));
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await deleteNotification(req.params['id']!, req.user!.sub));
  } catch (e) { next(e); }
}

export async function broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await broadcastNotification(req.body as BroadcastNotificationDto), 201);
  } catch (e) { next(e); }
}

export async function getPrefsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await getPreferences(req.user!.sub));
  } catch (e) { next(e); }
}

export async function updatePrefsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await updatePreferences(req.user!.sub, req.body));
  } catch (e) { next(e); }
}
