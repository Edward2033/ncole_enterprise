import React, { useEffect, useState, useCallback } from 'react';
import { Bike, RefreshCw, Pencil, Trash2, ShieldCheck, ShieldOff, CheckCircle } from 'lucide-react';
import { adminRidersApi, type AdminRider } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'green', BUSY: 'yellow', OFFLINE: 'slate',
};

interface EditForm {
  vehicleType: string;
  plateNumber: string;
  status: string;
}

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition';

const AdminRidersPage: React.FC = () => {
  const [riders,       setRiders]       = useState<AdminRider[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [editRider,    setEditRider]    = useState<AdminRider | null>(null);
  const [editForm,     setEditForm]     = useState<EditForm>({ vehicleType: '', plateNumber: '', status: 'OFFLINE' });
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState('');

  const [confirm, setConfirm] = useState<{
    rider: AdminRider;
    action: 'verify' | 'unverify' | 'delete';
  } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminRidersApi.list();
      setRiders(res.data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = riders.filter(r => {
    const matchSearch = !search
      || r.user.name.toLowerCase().includes(search.toLowerCase())
      || r.user.email.toLowerCase().includes(search.toLowerCase())
      || (r.vehicleType ?? '').toLowerCase().includes(search.toLowerCase())
      || (r.plateNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    AVAILABLE: riders.filter(r => r.status === 'AVAILABLE').length,
    BUSY:      riders.filter(r => r.status === 'BUSY').length,
    OFFLINE:   riders.filter(r => r.status === 'OFFLINE').length,
    VERIFIED:  riders.filter(r => r.isVerified).length,
  };

  const openEdit = (r: AdminRider) => {
    setEditForm({ vehicleType: r.vehicleType ?? '', plateNumber: r.plateNumber ?? '', status: r.status });
    setFormError('');
    setEditRider(r);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!editRider) return;
    setSaving(true);
    try {
      await adminRidersApi.update(editRider.id, {
        vehicleType: editForm.vehicleType || undefined,
        plateNumber: editForm.plateNumber || undefined,
        status: editForm.status as 'AVAILABLE' | 'BUSY' | 'OFFLINE',
      });
      setEditRider(null);
      await load();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.action === 'verify') {
        await adminRidersApi.update(confirm.rider.id, { isVerified: true });
      } else if (confirm.action === 'unverify') {
        await adminRidersApi.update(confirm.rider.id, { isVerified: false });
      } else if (confirm.action === 'delete') {
        await adminRidersApi.delete(confirm.rider.id);
      }
      setConfirm(null);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); }
  };

  const columns: Column<AdminRider>[] = [
    {
      key: 'rider', header: 'Rider',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-xs font-bold">
            {r.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{r.user.name}</p>
            <p className="text-xs text-slate-500 truncate">{r.user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicle',  header: 'Vehicle',  render: r => <span className="text-sm text-slate-600 dark:text-slate-300">{r.vehicleType ?? '—'}</span> },
    { key: 'plate',    header: 'Plate',    render: r => <span className="text-xs text-slate-500 font-mono">{r.plateNumber ?? '—'}</span> },
    { key: 'status',   header: 'Status',   render: r => <AdminBadge label={r.status} color={STATUS_COLOR[r.status] ?? 'slate'} /> },
    { key: 'verified', header: 'Verified', render: r => <AdminBadge label={r.isVerified ? 'Verified' : 'Unverified'} color={r.isVerified ? 'green' : 'yellow'} /> },
    { key: 'joined',   header: 'Joined',   render: r => <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: r => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(r)} title="Edit"
            className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {r.isVerified ? (
            <button
              onClick={() => setConfirm({ rider: r, action: 'unverify' })} title="Revoke verification"
              className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
            >
              <ShieldOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setConfirm({ rider: r, action: 'verify' })} title="Verify rider"
              className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            >
              <ShieldCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setConfirm({ rider: r, action: 'delete' })} title="Delete"
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const confirmMeta = confirm ? {
    verify:   { title: 'Verify Rider',   message: `Verify "${confirm.rider.user.name}"? They will be marked as a verified delivery rider.`, danger: false, label: 'Verify' },
    unverify: { title: 'Revoke Verification', message: `Revoke verification for "${confirm.rider.user.name}"?`, danger: true, label: 'Revoke' },
    delete:   { title: 'Delete Rider',   message: `Permanently delete "${confirm.rider.user.name}"? This cannot be undone.`, danger: true, label: 'Delete' },
  }[confirm.action] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
            <Bike className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Riders</h1>
            <p className="text-sm text-slate-500">{riders.length} registered · {counts.VERIFIED} verified · {counts.AVAILABLE} available now</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Available', value: counts.AVAILABLE, color: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700' },
          { label: 'Busy',      value: counts.BUSY,      color: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700' },
          { label: 'Offline',   value: counts.OFFLINE,   color: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
          { label: 'Verified',  value: counts.VERIFIED,  color: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700' },
        ].map(s => (
          <button key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.label.toUpperCase() && s.label !== 'Verified' ? 'ALL' : s.label === 'Verified' ? 'ALL' : s.label.toUpperCase())}
            className={`rounded-2xl border p-4 text-left transition ${statusFilter === s.label.toUpperCase() ? 'border-orange-300 dark:border-orange-700' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 hover:border-orange-200`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search riders…" className="flex-1 min-w-[200px] max-w-xs" />
        <div className="flex gap-1.5">
          {['ALL', 'AVAILABLE', 'BUSY', 'OFFLINE'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === s ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <AdminTable<AdminRider>
        columns={columns} data={filtered} keyFn={r => r.id}
        loading={loading} emptyText="No riders found" emptyIcon={<Bike />}
      />

      {/* Edit modal */}
      <AdminModal open={!!editRider} onClose={() => setEditRider(null)} title={`Edit: ${editRider?.user.name}`} size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">{formError}</div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Vehicle Type</label>
            <input className={inputCls} value={editForm.vehicleType}
              onChange={e => setEditForm(f => ({ ...f, vehicleType: e.target.value }))}
              placeholder="e.g. Motorcycle, Bicycle" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Plate Number</label>
            <input className={`${inputCls} font-mono`} value={editForm.plateNumber}
              onChange={e => setEditForm(f => ({ ...f, plateNumber: e.target.value }))}
              placeholder="e.g. RAD 123 A" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className={inputCls} value={editForm.status}
              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              <CheckCircle className="h-4 w-4" /> Save Changes
            </button>
            <button type="button" onClick={() => setEditRider(null)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Confirm modal */}
      {confirm && confirmMeta && (
        <ConfirmModal
          open danger={confirmMeta.danger}
          onClose={() => setConfirm(null)}
          onConfirm={handleConfirm}
          loading={acting}
          title={confirmMeta.title}
          message={confirmMeta.message}
          confirmLabel={confirmMeta.label}
        />
      )}
    </div>
  );
};

export default AdminRidersPage;
