import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { billingService, type NcoleInvoice, type NcolePayment } from '@/services/api';
import { formatRWF } from '@/lib/utils';

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-slate-100 text-slate-600' },
  ISSUED:    { label: 'Issued',    color: 'bg-blue-100 text-blue-700' },
  PAID:      { label: 'Paid',      color: 'bg-emerald-100 text-emerald-700' },
  OVERDUE:   { label: 'Overdue',   color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500' },
};

const PAYMENT_METHODS = [
  { value: 'MTN_MOMO',          label: 'MTN MoMo' },
  { value: 'AIRTEL_MONEY',      label: 'Airtel Money' },
  { value: 'CASH_ON_DELIVERY',  label: 'Cash on Delivery' },
];

const PAYMENT_STATUS: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  PENDING:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',    icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700',      icon: AlertCircle },
  VERIFIED:  { label: 'Verified',  color: 'bg-cyan-100 text-cyan-700',      icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',        icon: XCircle },
};

const Skeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
    ))}
  </div>
);

type Tab = 'invoices' | 'payments';

const BillingPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<NcoleInvoice[]>([]);
  const [payments, setPayments] = useState<NcolePayment[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payGateway, setPayGateway] = useState<Record<string, string>>({});
  const [payRef, setPayRef] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState<Record<string, string>>({});

  const reload = () => {
    setLoadingInvoices(true);
    setLoadingPayments(true);
    billingService.myInvoices()
      .then(r => setInvoices(r.data))
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));
    billingService.myPayments()
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  };

  useEffect(() => { reload(); }, []);

  const handlePay = async (inv: NcoleInvoice) => {
    const gateway = payGateway[inv.id] ?? 'MTN_MOMO';
    const gatewayRef = payRef[inv.id]?.trim() || undefined;
    setPayingId(inv.id);
    setPayError(prev => ({ ...prev, [inv.id]: '' }));
    try {
      await billingService.payInvoice(inv.id, { gateway, ...(gatewayRef ? { gatewayRef } : {}) });
      reload();
    } catch (e) {
      setPayError(prev => ({ ...prev, [inv.id]: (e as Error).message }));
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Billing &amp; Payments</h1>

      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {([['invoices', 'Invoices', FileText], ['payments', 'Payment History', CreditCard]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        loadingInvoices ? <Skeleton /> :
        invoices.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <FileText className="h-12 w-12 text-slate-200" />
            <h2 className="mt-4 font-semibold text-slate-900">No invoices yet</h2>
            <p className="mt-1 text-sm text-slate-400">Invoices are generated when you place orders.</p>
            <Link to="/shop" className="mt-5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => {
              const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: 'bg-slate-100 text-slate-600' };
              const isPaying = payingId === inv.id;
              const canPay = inv.status === 'ISSUED' || inv.status === 'OVERDUE';
              return (
                <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                      <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-slate-400">Issued {new Date(inv.issuedAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        {inv.paidAt && <p className="text-xs text-emerald-600">Paid {new Date(inv.paidAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                      <span className="text-base font-bold text-slate-900">{formatRWF(inv.total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <div className="flex gap-4 text-slate-500">
                      <span>Subtotal: {formatRWF(inv.subtotal)}</span>
                      {inv.deliveryFee > 0 && <span>Delivery: {formatRWF(inv.deliveryFee)}</span>}
                      {inv.tax > 0 && <span>Tax: {formatRWF(inv.tax)}</span>}
                    </div>
                    {/* C2: link to the specific order, not the list */}
                    <Link to={`/order/${inv.orderId}`} className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:gap-2 transition-all">
                      View Order <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  {canPay && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Submit Payment</p>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map(pm => (
                          <button key={pm.value}
                            onClick={() => setPayGateway(prev => ({ ...prev, [inv.id]: pm.value }))}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                              (payGateway[inv.id] ?? 'MTN_MOMO') === pm.value
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 text-slate-600 hover:border-orange-300'
                            }`}>{pm.label}</button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Transaction reference (optional)"
                        value={payRef[inv.id] ?? ''}
                        onChange={e => setPayRef(prev => ({ ...prev, [inv.id]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                      />
                      {payError[inv.id] && <p className="text-xs text-red-600">{payError[inv.id]}</p>}
                      <button
                        onClick={() => handlePay(inv)}
                        disabled={isPaying}
                        className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
                      >
                        {isPaying ? 'Submitting...' : `Pay ${formatRWF(inv.total)}`}
                      </button>
                    </div>
                  )}
                  {inv.notes && <p className="mt-2 text-xs text-slate-400 italic">{inv.notes}</p>}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'payments' && (
        loadingPayments ? <Skeleton /> :
        payments.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <CreditCard className="h-12 w-12 text-slate-200" />
            <h2 className="mt-4 font-semibold text-slate-900">No payment history</h2>
            <p className="mt-1 text-sm text-slate-400">Your payment transactions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(pay => {
              const st = PAYMENT_STATUS[pay.status] ?? { label: pay.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
              const Icon = st.icon;
              return (
                <div key={pay.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${st.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{pay.billingNumber}</p>
                        <p className="text-sm text-slate-500">{pay.gateway.replace(/_/g, ' ')} · {pay.currency}</p>
                        {pay.gatewayRef && <p className="text-xs text-slate-400">Ref: {pay.gatewayRef}</p>}
                        <p className="text-xs text-slate-400">{new Date(pay.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                      <span className="text-base font-bold text-slate-900">{formatRWF(pay.amount)}</span>
                    </div>
                  </div>
                  {pay.rejectionReason && (
                    <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">Rejection reason: {pay.rejectionReason}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default BillingPage;
