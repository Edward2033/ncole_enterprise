import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Send, Trash2, CheckCheck, RefreshCw, Globe, User } from 'lucide-react';
import { adminNotificationsApi, type AdminNotification, type AdminNotificationWithUser } from '@/services/adminApi';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';

const TYPE_COLORS: Record<string, string> = {
  SYSTEM_BROADCAST: 'purple', ORDER_CREATED: 'blue', ORDER_CONFIRMED: 'cyan',
  ORDER_DELIVERED: 'green', ORDER_CANCELLED: 'red', PAYMENT_STATUS: 'orange',
  VENDOR_APPROVAL: 'indigo', RIDER_ASSIGNMENT: 'teal',
  ORDER_SHIPPED: 'cyan', NEW_PRODUCT: 'blue', GENERAL: 'slate',
};

const NOTIF_TYPES = [
  { value: 'SYSTEM_BROADCAST', label: 'System Broadcast' },
  { value: 'PAYMENT_STATUS',   label: 'Payment Status' },
  { value: 'NEW_PRODUCT',      label: 'New Product' },
  { value: 'VENDOR_APPROVAL',  label: 'Vendor Approval' },
  { value: 'RIDER_ASSIGNMENT', label: 'Rider Assignment' },
  { value: 'ORDER_CREATED',    label: 'Order Created' },
  { value: 'ORDER_CONFIRMED',  label: 'Order Confirmed' },
  { value: 'ORDER_DELIVERED',  label: 'Order Delivered' },
  { value: 'ORDER_CANCELLED',  label: 'Order Cancelled' },
] as const;

interface BroadcastForm { type: string; title: string; message: string; }
const EMPTY_FORM: BroadcastForm = { type: 'SYSTEM_BROADCAST', title: '', message: '' };

type Tab = 'platform' | 'mine' | 'broadcast';

const AdminNotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('platform');

  // Platform-wide
  const [allNotifs,   setAllNotifs]   = useState<AdminNotificationWithUser[]>([]);
  const [allLoading,  setAllLoading]  = useState(true);
  const [allError,    setAllError]    = useState<string | null>(null);

  // Admin's own
  const [myNotifs,    setMyNotifs]    = useState<AdminNotification[]>([]);
  const [myLoading,   setMyLoading]   = useState(false);
  const [myError,     setMyError]     = useState<string | null>(null);

  // Broadcast
  const [form,        setForm]        = useState<BroadcastForm>(EMPTY_FORM);
  const [sending,     setSending]     = useState(false);
  const [sendError,   setSendError]   = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const [acting, setActing] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setAllLoading(true); setAllError(null);
    try {
      const res = await adminNotificationsApi.listAll(1, 50);
      setAllNotifs(res.data);
    } catch (e) { setAllError((e as Error).message); }
    finally { setAllLoading(false); }
  }, []);

  const loadMine = useCallback(async () => {
    setMyLoading(true); setMyError(null);
    try {
      const res = await adminNotificationsApi.list();
      setMyNotifs(res.data);
    } catch (e) { setMyError((e as Error).message); }
    finally { setMyLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (tab === 'mine' && myNotifs.length === 0) loadMine();
  }, [tab, myNotifs.length, loadMine]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault(); setSendError(''); setSendSuccess('');
    if (!form.title.trim() || !form.message.trim()) { setSendError('Title and message are required.'); return; }
    setSending(true);
    try {
      const res = await adminNotificationsApi.broadcast({ type: form.type, title: form.title, message: form.message });
      setSendSuccess(`Broadcast sent to ${res.data.sent} user${res.data.sent !== 1 ? 's' : ''} successfully!`);
      setForm(EMPTY_FORM);
      await loadAll();
      setTimeout(() => setSendSuccess(''), 5000);
    } catch (e) { setSendError((e as Error).message); }
    finally { setSending(false); }
  };

  const handleMarkRead = async (n: AdminNotification) => {
    if (n.isRead) return;
    setActing(n.id);
    try { await adminNotificationsApi.markRead(n.id); await loadMine(); }
    catch (e) { setMyError((e as Error).message); }
    finally { setActing(null); }
  };

  const handleDeleteMine = async (n: AdminNotification) => {
    setActing(n.id);
    try { await adminNotificationsApi.delete(n.id); setMyNotifs(p => p.filter(x => x.id !== n.id)); }
    catch (e) { setMyError((e as Error).message); }
    finally { setActing(null); }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'platform',  label: 'Platform Activity', icon: <Globe className="h-4 w-4" /> },
    { id: 'mine',      label: 'My Notifications',  icon: <User className="h-4 w-4" /> },
    { id: 'broadcast', label: 'Broadcast',          icon: <Send className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Bell className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-slate-500">Platform-wide activity and broadcast management</p>
          </div>
        </div>
        <button
          onClick={() => tab === 'platform' ? loadAll() : loadMine()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Platform Activity Tab ── */}
      {tab === 'platform' && (
        <div>
          {allError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-3">{allError}</div>}
          <p className="text-xs text-slate-400 mb-3">{allNotifs.length} recent platform notifications</p>
          {allLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : allNotifs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-16 text-center text-slate-400">
              <Bell className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No platform notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allNotifs.map(n => (
                <div key={n.id} className={`flex items-start gap-3 rounded-2xl border bg-white dark:bg-slate-800 px-4 py-3 ${n.isRead ? 'border-slate-100 dark:border-slate-700/50 opacity-70' : 'border-slate-200 dark:border-slate-700'}`}>
                  <AdminBadge label={n.type.replace(/_/g, ' ')} color={TYPE_COLORS[n.type] ?? 'slate'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                      {n.user && (
                        <span className="text-xs text-slate-400">→ {n.user.name} ({n.user.role})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{fmtDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Notifications Tab ── */}
      {tab === 'mine' && (
        <div>
          {myError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-3">{myError}</div>}
          {myLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : myNotifs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-16 text-center text-slate-400">
              <Bell className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No notifications for your account</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myNotifs.slice(0, 60).map(n => (
                <div key={n.id} className={`flex items-start gap-3 rounded-2xl border bg-white dark:bg-slate-800 px-4 py-3 transition ${n.isRead ? 'border-slate-100 dark:border-slate-700/50 opacity-60' : 'border-slate-200 dark:border-slate-700'}`}>
                  <AdminBadge label={n.type.replace(/_/g, ' ')} color={TYPE_COLORS[n.type] ?? 'slate'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(n.createdAt)}</span>
                    {!n.isRead && (
                      <button onClick={() => handleMarkRead(n)} disabled={acting === n.id} title="Mark as read"
                        className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40 transition">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteMine(n)} disabled={acting === n.id} title="Delete"
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Broadcast Tab ── */}
      {tab === 'broadcast' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Send className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Broadcast to All Users</h2>
          </div>
          {sendSuccess && <div className="mb-4 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">{sendSuccess}</div>}
          {sendError  && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{sendError}</div>}
          <form onSubmit={handleBroadcast} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400">
                {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                placeholder="Notification title…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Message *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} required
                placeholder="Notification message to all active users…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
                {sending
                  ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending…</>
                  : <><Send className="h-4 w-4" /> Send to All Users</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
