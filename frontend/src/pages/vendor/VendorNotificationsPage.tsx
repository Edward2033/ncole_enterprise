import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsService, type NcoleNotification } from '@/services/api';
import { PCard, PButton, Spinner } from '@/components/ui/portal-ui';
import { cn, formatDateTime } from '@/lib/utils';

const VendorNotificationsPage: React.FC = () => {
  const [items, setItems] = useState<NcoleNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationsService.list()
      .then(res => setItems(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationsService.markRead(id).catch(() => null);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await notificationsService.markAllRead().catch(() => null);
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unread = items.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Notifications</h1>
          {unread > 0 && <p className="text-xs text-slate-500 mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <PButton size="sm" variant="secondary" onClick={markAll}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </PButton>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-8"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-4"><Bell className="h-8 w-8 text-slate-400" /></div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No notifications</p>
          <p className="text-sm text-slate-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
              className={cn('cursor-pointer rounded-xl border p-4 transition-colors',
                n.isRead
                  ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  : 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/20')}>
              <div className="flex items-start gap-3">
                {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-violet-600" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorNotificationsPage;
