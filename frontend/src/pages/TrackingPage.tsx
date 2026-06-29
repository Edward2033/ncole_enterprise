import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, MapPin,
  ShoppingBag, ArrowLeft, Phone, RefreshCw,
} from 'lucide-react';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatPrice } from '@/lib/format';

// ─── Timeline steps ───────────────────────────────────────────────────────────
type StepKey = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

const STEPS: { key: StepKey; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'PENDING',          label: 'Order Placed',    desc: 'Your order has been received',          icon: ShoppingBag },
  { key: 'CONFIRMED',        label: 'Confirmed',       desc: 'Vendor confirmed your order',           icon: CheckCircle2 },
  { key: 'PROCESSING',       label: 'Processing',      desc: 'Your items are being prepared',         icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way to your location', icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered',       desc: 'Your order has been delivered',         icon: CheckCircle2 },
];

const STEP_ORDER: StepKey[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-violet-100 text-violet-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8 space-y-5">
    <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
    <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
    <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
    <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const TrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<NcoleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersService.myOrders(1, 100);
      const found = res.data.find(o => o.id === orderId);
      if (found) setOrder(found);
      else setError('Order not found.');
    } catch {
      setError('Failed to load tracking information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrder(); }, [orderId]);

  if (loading) return <Skeleton />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center lg:px-8">
        <Package className="mx-auto h-12 w-12 text-slate-200" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">{error || 'Order not found'}</h1>
        <Link to="/orders" className="mt-6 inline-block rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const currentStep = STEP_ORDER.indexOf(order.status as StepKey);
  const statusMeta = STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8">
      {/* Back */}
      <Link to="/orders" className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
          <p className="mt-0.5 text-sm text-slate-500">{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <button
            onClick={() => loadOrder(true)}
            disabled={refreshing}
            title="Refresh status"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Timeline ── */}
      {!isCancelled ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
          <h2 className="mb-6 font-bold text-slate-900">Delivery Progress</h2>
          <div className="relative space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative flex gap-4">
                  {/* Vertical line */}
                  {i < STEPS.length - 1 && (
                    <div className={`absolute left-[19px] top-10 h-full w-0.5 ${done ? 'bg-orange-400' : 'bg-slate-200'}`} />
                  )}
                  {/* Icon */}
                  <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-200 bg-white text-slate-300'
                  } ${active ? 'ring-4 ring-orange-500/20' : ''}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Content */}
                  <div className={`pb-8 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                    <p className={`font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                      {active && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                          Current
                        </span>
                      )}
                    </p>
                    <p className={`text-sm ${done ? 'text-slate-500' : 'text-slate-300'}`}>
                      {step.desc}
                    </p>
                    {active && (
                      <p className="mt-1 text-xs text-orange-500">
                        {new Date(order.createdAt).toLocaleDateString('en-RW', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-5">
          <p className="font-semibold text-red-800">
            Order {order.status === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
          </p>
          <p className="mt-1 text-sm text-red-600">
            This order is no longer active. Contact support if you need assistance.
          </p>
        </div>
      )}

      {/* ── Rider Info (placeholder — API integration point) ── */}
      {order.status === 'OUT_FOR_DELIVERY' && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 mb-5">
          <h2 className="mb-3 font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-500" /> Rider Information
          </h2>
          {/* NOTE: Backend has Rider model but no customer-facing rider details endpoint.
              This section shows a placeholder until the endpoint is available. */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-orange-700 text-lg font-bold">
              R
            </div>
            <div>
              <p className="font-semibold text-slate-900">Rider Assigned</p>
              <p className="text-sm text-slate-500">Your rider is on the way</p>
            </div>
            <a
              href="tel:+250788000000"
              className="ml-auto flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
            >
              <Phone className="h-3.5 w-3.5" /> Call Support
            </a>
          </div>
          <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-xs text-slate-500">
            Real-time rider location tracking will be available in a future update.
          </p>
        </div>
      )}

      {/* ── Delivery address ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-5">
        <h2 className="mb-3 font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" /> Delivery Address
        </h2>
        <p className="text-sm text-slate-500">
          {/* Address details would come from order.addressId lookup — not included in current NcoleOrder type */}
          Address details are visible in your{' '}
          <Link to={`/order/${order.id}`} className="text-orange-600 hover:underline">order details</Link>.
        </p>
      </div>

      {/* ── Order summary ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" /> Order Summary
        </h2>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {item.productName}
                {item.variantTitle ? ` (${item.variantTitle})` : ''} × {item.quantity}
              </span>
              <span className="font-medium text-slate-900">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
          <span>Total</span>
          <span className="text-orange-600">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
