import React, { useEffect, useState, useCallback } from 'react';
import { FileText, RefreshCw, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { adminApplicationsApi, type AdminApplication } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: 'ALL' },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const [viewApp, setViewApp]   = useState<AdminApplication | null>(null);
  const [confirm, setConfirm]   = useState<{
    app: AdminApplication;
    action: 'approve' | 'reject';
  } | null>(null);
  const [acting, setActing]         = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApplicationsApi.list();
      setApplications(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = applications.filter(a =>
    statusFilter === 'ALL' || a.status === statusFilter,
  );

  const counts = {
    PENDING:  applications.filter(a => a.status === 'PENDING').length,
    APPROVED: applications.filter(a => a.status === 'APPROVED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    setActionError(null);
    try {
      await adminApplicationsApi.review(
        confirm.app.id,
        confirm.action === 'approve' ? 'APPROVE' : 'REJECT',
      );
      setConfirm(null);
      setActionError(null);
      await load();
    } catch (e) {
      const msg = (e as Error).message;
      setActionError(
        msg.includes('already been reviewed')
          ? 'This application was already reviewed. Refreshing list…'
          : msg,
      );
      // Still reload so the UI reflects the actual DB state
      await load();
    } finally {
      setActing(false);
    }
  };

  const displayName = (a: AdminApplication) =>
    a.role === 'VENDOR' ? (a.businessName ?? a.fullName) : a.fullName;

  const columns: Column<AdminApplication>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      render: a => (
        <div className="flex items-center gap-3 min-w-0">
          {a.photoUrl ? (
            <img
              src={a.photoUrl}
              alt={a.fullName}
              className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {a.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <button
              onClick={() => setViewApp(a)}
              className="font-medium text-orange-600 hover:underline truncate text-left block max-w-[160px]"
            >
              {displayName(a)}
            </button>
            <p className="text-xs text-slate-400 truncate">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: a => (
        <AdminBadge
          label={a.role}
          color={a.role === 'VENDOR' ? 'orange' : 'teal'}
        />
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: a => (
        <span className="text-xs font-mono text-slate-500">{a.phone}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: a => (
        <AdminBadge
          label={a.status}
          color={STATUS_COLOR[a.status] ?? 'slate'}
        />
      ),
    },
    {
      key: 'applied',
      header: 'Applied',
      render: a => <span className="text-xs text-slate-500">{fmtDate(a.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: a => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewApp(a)}
            title="View application"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Eye className="h-4 w-4" />
          </button>
          {a.status === 'PENDING' && (
            <>
              <button
                onClick={() => setConfirm({ app: a, action: 'approve' })}
                title="Approve"
                className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirm({ app: a, action: 'reject' })}
                title="Reject"
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const confirmMeta = confirm
    ? {
        approve: {
          title: 'Approve Application',
          message: `Approve application for "${displayName(confirm.app)}"? A user account will be created and a welcome email sent.`,
          danger: false,
          label: 'Approve',
        },
        reject: {
          title: 'Reject Application',
          message: `Reject application for "${displayName(confirm.app)}"? This action cannot be undone.`,
          danger: true,
          label: 'Reject',
        },
      }[confirm.action]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Applications
            </h1>
            <p className="text-sm text-slate-500">
              Review and action Vendor &amp; Rider onboarding requests
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { label: 'Pending Review', value: counts.PENDING,  icon: Clock,         color: 'text-yellow-700', bg: 'bg-yellow-100 dark:bg-yellow-900/30', filter: 'PENDING'  },
            { label: 'Approved',       value: counts.APPROVED, icon: CheckCircle,   color: 'text-green-700',  bg: 'bg-green-100 dark:bg-green-900/30',   filter: 'APPROVED' },
            { label: 'Rejected',       value: counts.REJECTED, icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-100 dark:bg-red-900/30',       filter: 'REJECTED' },
          ] as const
        ).map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.filter ? 'ALL' : s.filter)}
            className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 text-left transition hover:border-orange-200 ${
              statusFilter === s.filter
                ? 'border-orange-300 dark:border-orange-700'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>
                  {loading ? '—' : s.value}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === opt.value
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
            {opt.value !== 'ALL' && (
              <span className="ml-1.5 opacity-70">
                ({opt.value === 'PENDING' ? counts.PENDING : opt.value === 'APPROVED' ? counts.APPROVED : counts.REJECTED})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      <AdminTable<AdminApplication>
        columns={columns}
        data={filtered}
        keyFn={a => a.id}
        loading={loading}
        emptyText="No applications found"
        emptyIcon={<FileText />}
      />

      {/* View detail modal */}
      <AdminModal
        open={!!viewApp}
        onClose={() => setViewApp(null)}
        title="Application Details"
        size="lg"
      >
        {viewApp && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              {viewApp.photoUrl ? (
                <img
                  src={viewApp.photoUrl}
                  alt={viewApp.fullName}
                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {viewApp.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {displayName(viewApp)}
                </h3>
                <div className="flex items-center gap-2">
                  <AdminBadge label={viewApp.role}   color={viewApp.role === 'VENDOR' ? 'orange' : 'teal'} />
                  <AdminBadge label={viewApp.status} color={STATUS_COLOR[viewApp.status] ?? 'slate'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['Full Name',    viewApp.fullName],
                  ['Email',        viewApp.email],
                  ['Phone',        viewApp.phone],
                  ['National ID',  viewApp.nationalId],
                  ['Date of Birth', fmtDate(viewApp.dateOfBirth)],
                  ['Province',     viewApp.province],
                  ['District',     viewApp.district],
                  ['Applied On',   fmtDate(viewApp.createdAt)],
                  ...(viewApp.role === 'VENDOR' ? [
                    ['Business Name',    viewApp.businessName  ?? '—'],
                    ['Business Type',    viewApp.businessType  ?? '—'],
                    ['Business Address', viewApp.businessAddress ?? '—'],
                    ['MoMo Number',      viewApp.momoNumber    ?? '—'],
                    ['Years in Business', String(viewApp.yearsInBusiness ?? '—')],
                  ] : [
                    ['Vehicle Type',   viewApp.vehicleType   ?? '—'],
                    ['Plate Number',   viewApp.plateNumber   ?? '—'],
                    ['License Number', viewApp.licenseNumber ?? '—'],
                    ['Delivery Zone',  viewApp.deliveryZone  ?? '—'],
                  ]),
                  ['Emergency Contact', viewApp.emergencyName],
                  ['Emergency Phone',   viewApp.emergencyPhone],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-slate-900 dark:text-white break-all">{value}</p>
                </div>
              ))}
            </div>

            {(viewApp.description || viewApp.experience) && (
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  {viewApp.role === 'VENDOR' ? 'Business Description' : 'Delivery Experience'}
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewApp.description ?? viewApp.experience}
                </p>
              </div>
            )}

            {viewApp.reviewNote && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                <p className="text-xs text-slate-400 mb-0.5">Review Note</p>
                <p className="text-slate-700 dark:text-slate-300">{viewApp.reviewNote}</p>
              </div>
            )}

            {viewApp.status === 'PENDING' && (
              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => { setViewApp(null); setConfirm({ app: viewApp, action: 'approve' }); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => { setViewApp(null); setConfirm({ app: viewApp, action: 'reject' }); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Confirm modal */}
      {confirm && confirmMeta && (
        <ConfirmModal
          open
          danger={confirmMeta.danger}
          onClose={() => { setConfirm(null); setActionError(null); }}
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

export default AdminApplicationsPage;
