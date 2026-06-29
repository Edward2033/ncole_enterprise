import React, { useEffect, useState, useCallback } from 'react';
import { Store, CheckCircle, XCircle, RefreshCw, DatabaseZap } from 'lucide-react';
import { adminVendorsApi, type AdminVendor } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { statusBadge, verifiedBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';

type Filter = 'ALL' | 'PENDING' | 'VERIFIED' | 'INACTIVE';

const AdminVendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [confirm, setConfirm] = useState<{ vendor: AdminVendor; action: 'approve' | 'reject' | 'suspend' | 'reactivate' } | null>(null);
  const [acting, setActing] = useState(false);
  const [detail, setDetail] = useState<AdminVendor | null>(null);

  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);

  const handleBackfill = async () => {
    setBackfilling(true); setBackfillMsg(null);
    try {
      const res = await adminVendorsApi.backfill();
      setBackfillMsg(`Backfill done: ${res.data.created} vendor profile(s) created out of ${res.data.checked} VENDOR-role users.`);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBackfilling(false); }
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminVendorsApi.list();
      setVendors(res.data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vendors
    .filter(v => filter === 'ALL' || (filter === 'PENDING' && !v.isVerified && v.isActive) || (filter === 'VERIFIED' && v.isVerified && v.isActive) || (filter === 'INACTIVE' && !v.isActive))
    .filter(v => !search || v.businessName.toLowerCase().includes(search.toLowerCase()) || (v.user?.email ?? '').toLowerCase().includes(search.toLowerCase()));

  const counts: Record<Filter, number> = {
    ALL: vendors.length,
    PENDING: vendors.filter(v => !v.isVerified && v.isActive).length,
    VERIFIED: vendors.filter(v => v.isVerified && v.isActive).length,
    INACTIVE: vendors.filter(v => !v.isActive).length,
  };

  const handleAction = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      const { vendor, action } = confirm;
      if (action === 'approve') await adminVendorsApi.update(vendor.id, { isVerified: true, isActive: true });
      else if (action === 'reject') await adminVendorsApi.update(vendor.id, { isVerified: false, isActive: false });
      else if (action === 'suspend') await adminVendorsApi.update(vendor.id, { isActive: false });
      else if (action === 'reactivate') await adminVendorsApi.update(vendor.id, { isActive: true });
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); setConfirm(null); }
  };

  const columns: Column<AdminVendor>[] = [
    {
      key: 'biz', header: 'Business',
      render: v => (
        <div>
          <button onClick={() => setDetail(v)} className="font-medium text-orange-600 hover:underline text-left">{v.businessName}</button>
          <p className="text-xs text-slate-500">{v.user?.name} · {v.user?.email}</p>
        </div>
      ),
    },
    { key: 'verified', header: 'Verified', render: v => verifiedBadge(v.isVerified) },
    { key: 'status',   header: 'Status',   render: v => statusBadge(v.isActive) },
    { key: 'joined',   header: 'Joined',   render: v => <span className="text-xs text-slate-500">{fmtDate(v.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: v => (
        <div className="flex flex-wrap gap-1.5">
          {!v.isVerified && v.isActive && (
            <button onClick={() => setConfirm({ vendor: v, action: 'approve' })}
              className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition">
              <CheckCircle className="h-3 w-3" /> Approve
            </button>
          )}
          {v.isActive && !v.isVerified && (
            <button onClick={() => setConfirm({ vendor: v, action: 'reject' })}
              className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">
              <XCircle className="h-3 w-3" /> Reject
            </button>
          )}
          {v.isVerified && v.isActive && (
            <button onClick={() => setConfirm({ vendor: v, action: 'suspend' })}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              Suspend
            </button>
          )}
          {!v.isActive && (
            <button onClick={() => setConfirm({ vendor: v, action: 'reactivate' })}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  const actionLabels = { approve: 'Approve', reject: 'Reject', suspend: 'Suspend', reactivate: 'Reactivate' };
  const actionMessages = {
    approve: `Approve vendor "${confirm?.vendor.businessName}"? They will be able to list products.`,
    reject: `Reject vendor "${confirm?.vendor.businessName}"? Their account will be deactivated.`,
    suspend: `Suspend vendor "${confirm?.vendor.businessName}"?`,
    reactivate: `Reactivate vendor "${confirm?.vendor.businessName}"?`,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Store className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendors</h1>
            <p className="text-sm text-slate-500">{vendors.length} total · {counts.PENDING} pending approval</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBackfill} disabled={backfilling}
            title="Create vendor profiles for any VENDOR-role users that are missing one"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50">
            <DatabaseZap className="h-4 w-4" /> {backfilling ? 'Running…' : 'Backfill'}
          </button>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['ALL', 'PENDING', 'VERIFIED', 'INACTIVE'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-2xl border p-4 text-left transition ${filter === f ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:border-orange-200'}`}>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts[f]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{f === 'ALL' ? 'Total Vendors' : f === 'PENDING' ? 'Pending Approval' : f === 'VERIFIED' ? 'Active Verified' : 'Inactive'}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <AdminSearch value={search} onChange={setSearch} placeholder="Search vendors…" className="max-w-sm" />

      {backfillMsg && <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">{backfillMsg}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <AdminTable<AdminVendor>
        columns={columns} data={filtered} keyFn={v => v.id}
        loading={loading} emptyText="No vendors found" emptyIcon={<Store />}
      />

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmModal
          open danger={confirm.action === 'reject' || confirm.action === 'suspend'}
          onClose={() => setConfirm(null)} onConfirm={handleAction} loading={acting}
          title={actionLabels[confirm.action]} message={actionMessages[confirm.action]}
          confirmLabel={actionLabels[confirm.action]}
        />
      )}

      {/* Detail modal */}
      <AdminModal open={!!detail} onClose={() => setDetail(null)} title="Vendor Details">
        {detail && (
          <div className="space-y-3 text-sm">
            {[
              ['Business Name', detail.businessName],
              ['Owner', detail.user?.name ?? '—'],
              ['Email', detail.user?.email ?? '—'],
              ['MoMo Number', detail.momoNumber ?? '—'],
              ['Verified', detail.isVerified ? 'Yes' : 'No'],
              ['Active', detail.isActive ? 'Yes' : 'No'],
              ['Joined', fmtDate(detail.createdAt)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500">{l}</span>
                <span className="font-medium text-slate-900 dark:text-white">{v}</span>
              </div>
            ))}
            {detail.description && (
              <div>
                <p className="text-slate-500 mb-1">Description</p>
                <p className="text-slate-700 dark:text-slate-300">{detail.description}</p>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminVendorsPage;
