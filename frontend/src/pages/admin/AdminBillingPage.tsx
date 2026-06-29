import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, DollarSign, TrendingUp, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { adminBillingApi, type AdminPayment, type AdminRevenueReport, type ApiMeta } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { paymentStatusBadge } from '@/components/admin/AdminBadge';
import { fmtRWF, fmtDate } from '@/lib/adminFormat';

const FILTERS = ['ALL','SUBMITTED','COMPLETED','REJECTED','PENDING'] as const;

const AdminBillingPage: React.FC = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [report, setReport] = useState<AdminRevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detail, setDetail] = useState<AdminPayment | null>(null);
  const [confirm, setConfirm] = useState<{ payment: AdminPayment; action: 'VERIFY' | 'REJECT' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const loadPayments = useCallback(async (p = page, s = statusFilter) => {
    setLoading(true); setError(null);
    try {
      const res = await adminBillingApi.listPayments({ page: p, limit: 20, status: s === 'ALL' ? undefined : s });
      setPayments(res.data);
      setMeta(res.meta);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { loadPayments(page, statusFilter); }, [page, statusFilter]);
  useEffect(() => {
    setReportLoading(true);
    adminBillingApi.revenueReport().then(r => setReport(r.data)).catch(() => null).finally(() => setReportLoading(false));
  }, []);

  const handleVerify = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      await adminBillingApi.verifyPayment(confirm.payment.id, confirm.action, rejectReason || undefined);
      setConfirm(null); setRejectReason('');
      await loadPayments(page, statusFilter);
      // Refresh report
      adminBillingApi.revenueReport().then(r => setReport(r.data)).catch(() => null);
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); }
  };

  const columns: Column<AdminPayment>[] = [
    {
      key: 'ref', header: 'Reference',
      render: p => (
        <div>
          <p className="font-mono text-xs font-medium dark:text-white">{p.billingNumber}</p>
          <p className="text-xs text-slate-500">{p.invoice?.invoiceNumber}</p>
        </div>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      render: p => (
        <div>
          <p className="text-sm dark:text-white">{p.customer?.user.name ?? '—'}</p>
          <p className="text-xs text-slate-500">{p.customer?.user.email ?? ''}</p>
        </div>
      ),
    },
    { key: 'amount',  header: 'Amount',  render: p => <span className="font-semibold dark:text-white">{fmtRWF(p.amount)}</span> },
    { key: 'gateway', header: 'Gateway', render: p => <span className="text-xs text-slate-500">{p.gateway.replace(/_/g,' ')}</span> },
    { key: 'status',  header: 'Status',  render: p => paymentStatusBadge(p.status) },
    { key: 'date',    header: 'Date',    render: p => <span className="text-xs text-slate-500">{p.submittedAt ? fmtDate(p.submittedAt) : fmtDate(p.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: p => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDetail(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"><Eye className="h-4 w-4"/></button>
          {p.status === 'SUBMITTED' && (
            <>
              <button onClick={() => setConfirm({ payment: p, action: 'VERIFY' })}
                className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition">
                <CheckCircle className="h-3 w-3"/> Verify
              </button>
              <button onClick={() => setConfirm({ payment: p, action: 'REJECT' })}
                className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">
                <XCircle className="h-3 w-3"/> Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100"><CreditCard className="h-5 w-5 text-green-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Payments</h1>
            <p className="text-sm text-slate-500">Verify payments and view revenue</p>
          </div>
        </div>
        <button onClick={() => { loadPayments(page, statusFilter); adminBillingApi.revenueReport().then(r => setReport(r.data)).catch(() => null); }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      {/* Revenue cards */}
      {reportLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"/>)}
        </div>
      ) : report && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100"><DollarSign className="h-5 w-5 text-green-600"/></div>
            <div><p className="text-xs text-slate-500">Total Revenue</p><p className="text-xl font-bold dark:text-white">{fmtRWF(report.totalRevenue)}</p></div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600"/></div>
            <div><p className="text-xs text-slate-500">Verified Payments</p><p className="text-xl font-bold dark:text-white">{report.count}</p></div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">By Gateway</p>
            {Object.keys(report.byGateway).length === 0
              ? <p className="text-xs text-slate-400">No verified payments</p>
              : Object.entries(report.byGateway).map(([gw, amt]) => (
                  <div key={gw} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-500">{gw.replace(/_/g,' ')}</span>
                    <span className="font-semibold dark:text-white">{fmtRWF(amt)}</span>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === f ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <AdminTable<AdminPayment>
        columns={columns} data={payments} keyFn={p => p.id}
        loading={loading} emptyText="No payments found" emptyIcon={<CreditCard/>}
        page={page} totalPages={meta?.totalPages} total={meta?.total} onPage={p => setPage(p)}
      />

      {/* Verify / Reject dialog */}
      {confirm && (
        <AdminModal
          open onClose={() => { setConfirm(null); setRejectReason(''); }}
          title={confirm.action === 'VERIFY' ? 'Verify Payment' : 'Reject Payment'}
          size="sm"
          footer={
            <>
              <button onClick={() => { setConfirm(null); setRejectReason(''); }} disabled={acting}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleVerify} disabled={acting}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 inline-flex items-center gap-2 ${confirm.action === 'REJECT' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                {acting && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"/>}
                {confirm.action === 'VERIFY' ? 'Verify' : 'Reject'}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              {confirm.action === 'VERIFY'
                ? `Confirm payment ${confirm.payment.billingNumber} (${fmtRWF(confirm.payment.amount)})?`
                : `Reject payment ${confirm.payment.billingNumber}?`}
            </p>
            {confirm.action === 'REJECT' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rejection reason (optional)</label>
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Enter reason…"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400"/>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Detail modal */}
      <AdminModal open={!!detail} onClose={() => setDetail(null)} title="Payment Details">
        {detail && (
          <div className="space-y-2 text-sm">
            {[
              ['Reference', detail.billingNumber], ['Invoice', detail.invoice?.invoiceNumber ?? '—'],
              ['Customer', detail.customer?.user.name ?? '—'], ['Amount', fmtRWF(detail.amount)],
              ['Gateway', detail.gateway.replace(/_/g,' ')], ['Status', detail.status],
              ['Ref ID', detail.gatewayRef ?? '—'],
              ['Submitted', detail.submittedAt ? fmtDate(detail.submittedAt) : '—'],
              ['Verified', detail.verifiedAt ? fmtDate(detail.verifiedAt) : '—'],
              ...(detail.rejectionReason ? [['Rejection Reason', detail.rejectionReason]] : []),
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500">{l}</span>
                <span className="font-medium dark:text-white">{v}</span>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminBillingPage;
