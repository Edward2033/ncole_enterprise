import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, ShoppingBag, Package, Star, Megaphone, Info } from 'lucide-react';
import { notificationsService, type NcoleNotification } from '@/services/api';

// ─── Icon map by notification type ───────────────────────────────────────────
const TYPE_ICON: Record<string, React.FC<{ className?: string }>> = {
  ORDER_CREATED: ShoppingBag,
  ORDER_CONFIRMED: CheckCheck,
  ORDER_SHIPPED: Package,
  ORDER_DELIVERED: Package,
  ORDER_CANCELLED: Package,
  PAYMENT_STATUS: Info,
  NEW_PRODUCT: Star,
  SYSTEM_BROADCAST: Megaphone,
  VENDOR_APPROVAL: Info,
  RIDER_ASSIGNMENT: Package,
};

const TYPE_COLOR: Record<string, string> = {
  ORDER_CREATED: 'bg-orange-100 text-orange-600',
  ORDER_CONFIRMED: 'bg-blue-100 text-blue-600',
  ORDER_SHIPPED: 'bg-violet-100 text-violet-600',
  ORDER_DELIVERED: 'bg-emerald-100 text-emerald-600',
  ORDER_CANCELLED: 'bg-red-100 text-red-600',
  PAYMENT_STATUS: 'bg-amber-100 text-amber-600',
  NEW_PRODUCT: 'bg-pink-100 text-pink-600',
  SYSTEM_BROADCAST: 'bg-slate-100 text-slate-600',
  VENDOR_APPROVAL: 'bg-cyan-100 text-cyan-600',
  RIDER_ASSIGNMENT: 'bg-indigo-100 text-indigo-600',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NcoleNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    notificationsService.list()
      .then(r => setNotifications(r.data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n),
      );
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.remove(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            Notifications
            {unreadCount > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 transition"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Bell className="h-8 w-8 text-slate-300" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">No notifications yet</h2>
          <p className="mt-1 text-sm text-slate-400">We'll notify you about orders, deals, and updates here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const colorClass = TYPE_COLOR[n.type] ?? 'bg-slate-100 text-slate-600';
            return (
              <div
                key={n.id}
                className={`group flex gap-4 rounded-2xl border p-4 transition ${
                  n.isRead
                    ? 'border-slate-200 bg-white'
                    : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                      {!n.isRead && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-orange-500 align-middle" />
                      )}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          title="Mark as read"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        title="Delete"
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{n.message}</p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString('en-RW', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
