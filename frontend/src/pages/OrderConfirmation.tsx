import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, CreditCard, Clock, XCircle, Download } from 'lucide-react';
import { ordersService, billingService, type NcoleOrder, type NcoleInvoice } from '@/services/api';
import { formatPrice } from '@/lib/format';

const PAYMENT_STATUS_CONFIG = {
  PENDING:   { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',  label: 'Payment Pending' },
  PAID:      { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Payment Confirmed' },
  FAILED:    { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50 border-red-200',      label: 'Payment Failed' },
  REFUNDED:  { icon: ArrowRight,    color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200',  label: 'Refunded' },
} as const;

const OrderConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<NcoleOrder | null>(null);
  const [invoice, setInvoice] = useState<NcoleInvoice | null>(null);

  useEffect(() => {
    if (!id) return;
    ordersService.getById(id)
      .then(res => {
        setOrder(res.data);
        // Load invoice for this order
        billingService.myInvoices()
          .then(r => {
            const inv = r.data.find(i => i.orderId === res.data.id);
            if (inv) setInvoice(inv);
          })
          .catch(() => null);
      })
      .catch(() => null);
  }, [id]);

  const psConfig = order
    ? PAYMENT_STATUS_CONFIG[order.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG] ?? PAYMENT_STATUS_CONFIG.PENDING
    : null;
  const StatusIcon = psConfig?.icon ?? Clock;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Order Placed!</h1>
        <p className="mt-3 text-slate-500">
          Thank you for shopping with N_COLE Interpress. Your order has been received.
        </p>
        {order && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5">
            <span className="text-sm font-semibold text-orange-700">{order.orderNumber}</span>
          </div>
        )}
      </div>

      {order && (
        <>
          {/* Payment status banner */}
          <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${psConfig?.bg}`}>
            <StatusIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${psConfig?.color}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${psConfig?.color}`}>{psConfig?.label}</p>
              {order.paymentStatus === 'PENDING' && (
                <p className="mt-0.5 text-xs text-amber-600">
                  Submit your {order.paymentMethod.replace(/_/g, ' ')} payment reference to complete this order.
                </p>
              )}
              {order.paymentStatus === 'PAID' && (
                <p className="mt-0.5 text-xs text-emerald-600">Your payment has been confirmed. Order is being processed.</p>
              )}
            </div>
            {order.paymentStatus === 'PENDING' && (
              <Link to="/account/billing"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition">
                <CreditCard className="h-3.5 w-3.5" /> Pay Now
              </Link>
            )}
          </div>

          {/* Order summary */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Package className="h-5 w-5 text-orange-500" /> Order Summary
            </h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.productName}{item.variantTitle ? ` (${item.variantTitle})` : ''} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="text-emerald-600">Free</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span><span className="text-orange-600">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Invoice info */}
            {invoice && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Invoice: {invoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">Issued {new Date(invoice.issuedAt).toLocaleDateString()}</p>
                </div>
                <Link to="/account/billing"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-400 hover:text-orange-600 transition">
                  <Download className="h-3 w-3" /> View Invoice
                </Link>
              </div>
            )}
          </div>

          {/* Estimated delivery */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Estimated Delivery</p>
              <p className="text-xs text-slate-500">2–5 business days after payment confirmation</p>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/shop" className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/account/orders" className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <Package className="h-4 w-4" /> View Orders
        </Link>
        <Link to="/account/billing" className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <CreditCard className="h-4 w-4" /> Billing
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
