import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, CreditCard, Clock,
  CheckCircle2, XCircle, Truck, ShoppingBag, ChevronRight, RefreshCw,
} from 'lucide-react';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatPrice } from '@/lib/format';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-violet-100 text-violet-700',
  READY_FOR_PICKUP: 'bg-cyan-100 text-cyan-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

// All 6 active stages in order — customer sees every step
const TIMELINE_STEPS = [
  { key: 'PENDING',          label: 'Order Placed',     icon: ShoppingBag  },
  { key: 'CONFIRMED',        label: 'Confirmed',         icon: CheckCircle2 },
  { key: 'PROCESSING',       label: 'Processing',        icon: Package      },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup',  icon: MapPin       },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way',        icon: Truck        },
  { key: 'DELIVERED',        label: 'Delivered',         icon: CheckCircle2 },
];

const STEP_ORDER = [
  'PENDING', 'CONFIRMED', 'PROCESSING',
  'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 space-y-5">
    <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // 30 seconds

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<NcoleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback((silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    ordersService.getById(id)
      .then(res => { setOrder(res.data); setError(''); })
      .catch(() => { if (!silent) setError('Order not found.'); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [id]);

  // Initial load
  useEffect(() => { fetchOrder(false); }, [fetchOrder]);

  // Poll every 30s so the customer sees status changes without manual reload.
  // Only polls for active (non-terminal) orders to avoid unnecessary requests.
  useEffect(() => {
    const TERMINAL = ['DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!id || (order && TERMINAL.includes(order.status))) return;
    const timer = setInterval(() => fetchOrder(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [id, order, fetchOrder]);

  if (loading) return <Skeleton />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-8">
        <XCircle className="mx-auto h-12 w-12 text-red-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">{error || 'Order not found'}</h1>
        <button onClick={() => navigate('/orders')}
          className="mt-6 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition">
          Back to Orders
        </button>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const currentStep = STEP_ORDER.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      {/* Back nav */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/orders" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> My Orders
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-700 font-medium">{order.orderNumber}</span>
        </div>
        <button onClick={() => fetchOrder(true)} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition disabled:opacity-40">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(order.createdAt).toLocaleDateString('en-RW', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
      </div>

      {/* Order Timeline — all 6 stages including READY_FOR_PICKUP */}
      {!isCancelled && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
          <h2 className="mb-5 font-bold text-slate-900">Order Timeline</h2>
          <div className="relative flex items-start justify-between overflow-x-auto pb-2">
            {/* progress bar */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 mx-6" aria-hidden="true">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: currentStep >= 0 ? `${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}%` : '0%' }}
              />
            </div>
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative flex flex-col items-center gap-2 flex-1 min-w-[60px]">
                  <div className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    done ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 bg-white text-slate-300'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-center text-[10px] font-medium leading-tight ${done ? 'text-orange-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-5 flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Order {STATUS_LABEL[order.status]}</p>
            <p className="text-sm text-red-600">This order has been {order.status.toLowerCase()}. Contact support if you need assistance.</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
        <h2 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" /> Order Items
        </h2>
        <div className="space-y-4">
          {order.items.map(item => {
            const imgUrl = item.product?.images?.[0] ?? item.imageUrl;
            return (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                  {item.variantTitle && <p className="text-xs text-slate-500">{item.variantTitle}</p>}
                  <p className="text-xs text-slate-400">Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}</p>
                </div>
                <span className="font-bold text-slate-900 whitespace-nowrap">{formatPrice(item.total)}</span>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-5 border-t border-slate-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Delivery Fee</span>
            <span className={order.deliveryFee === 0 ? 'text-emerald-600 font-medium' : ''}>
              {order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}
            </span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Tax</span><span>{formatPrice(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="text-orange-600">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
        <h2 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-500" /> Payment Information
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-semibold text-slate-900">{order.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Status</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              order.paymentStatus === 'PAID'   ? 'bg-emerald-100 text-emerald-700' :
              order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
        {order.paymentStatus === 'PENDING' && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
            <strong>Payment pending:</strong> Please submit payment via {order.paymentMethod.replace(/_/g, ' ')} to complete your order.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/shop"
          className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          Continue Shopping
        </Link>
        <Link to="/orders"
          className="flex items-center justify-center rounded-full border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          All Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetailPage;
