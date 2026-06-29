import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, RefreshCw, X } from 'lucide-react';
import { adminActivityLogApi, type ActivityLogEntry, type ApiMeta } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmtDateTime } from '@/lib/adminFormat';

const ACTION_OPTIONS = [
  'ALL',
  'LOGIN', 'LOGOUT', 'REGISTER', 'ROLE_CHANGED',
  'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
  'ORDER_CREATED', 'ORDER_STATUS_CHANGED',
  'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PAYMENT_REJECTED',
  'AI_INTERACTION', 'VENDOR_VERIFIED', 'USER_DEACTIVATED',
] as const;

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'green', LOGOUT: 'slate', REGISTER: 'blue',
  PRODUCT_CREATED: 'teal', PRODUCT_UPDATED: 'cyan', PRODUCT_DELETED: 'red',
  ORDER_CREATED: 'blue', ORDER_STATUS_CHANGED: 'purple',
  PAYMENT_SUBMITTED: 'orange', PAYMENT_VERIFIED: 'green', PAYMENT_REJECTED: 'red',
  AI_INTERACTION: 'indigo', VENDOR_VERIFIED: 'green', USER_DEACTIVATED: 'red',
  ROLE_CHANGED: 'yellow',
};

const AdminActivityLogPage: React.FC = () => {
  const [logs,    setLogs]    = useState<ActivityLogEntry[]>([]);
  const [meta,    setMeta]    = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [action,  setAction]  = useState('ALL');

  const load = useCallback(async (p = page, a = action) => {
    setLoading(true); setError(null);
    try {
      const res = await adminActivityLogApi.list(p, 50, a !== 'ALL' ? a : undefined);
      setLogs(res.data);
      setMeta(res.meta);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, action]);

  useEffect(() => { load(page, action); }, [page, action]);

  const columns: Column<ActivityLogEntry>[] = [
    {
      key: 'action', header: 'Action',
      render: l => <AdminBadge label={l.action.replace(/_/g, ' ')} color={ACTION_COLOR[l.action] ?? 'slate'} />,
    },
    {
      key: 'user', header: 'User',
      render: l => l.user
        ? (
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{l.user.name}</p>
            <p className="text-xs text-slate-500">{l.user.email}</p>
          </div>
        )
        : <span className="text-xs text-slate-400">System</span>,
    },
    {
      key: 'entity', header: 'Entity',
      render: l => l.entity
        ? <span className="text-xs text-slate-600 dark:text-slate-300">{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ''}</span>
        : <span className="text-xs text-slate-400">—</span>,
    },
    {
      key: 'ip', header: 'IP',
      render: l => <span className="text-xs font-mono text-slate-500">{l.ipAddress ?? '—'}</span>,
    },
    {
      key: 'time', header: 'Timestamp',
      render: l => <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <ClipboardList className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
            <p className="text-sm text-slate-500">{meta?.total ?? '—'} total audit events</p>
          </div>
        </div>
        <button onClick={() => load(page, action)} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Action filter */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Filter:</span>
        {ACTION_OPTIONS.map(a => (
          <button key={a} onClick={() => { setAction(a); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${action === a ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
            {a === 'ALL' ? 'All' : a.replace(/_/g, ' ')}
          </button>
        ))}
        {action !== 'ALL' && (
          <button onClick={() => { setAction('ALL'); setPage(1); }}
            className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <AdminTable<ActivityLogEntry>
        columns={columns} data={logs} keyFn={l => l.id}
        loading={loading} emptyText="No activity logs found" emptyIcon={<ClipboardList />}
        page={page} totalPages={meta?.totalPages} total={meta?.total}
        onPage={p => setPage(p)}
      />
    </div>
  );
};

export default AdminActivityLogPage;
