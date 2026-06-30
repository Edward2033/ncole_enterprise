import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, CheckCircle, ArrowRight, Package,
  MapPin, CreditCard, Bell, TrendingUp, Star, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatRWF, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, type OrderStatus } from '@/lib/utils';

// ── Animated stat card ───────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  delay?: string;
}> = ({ icon, label, value, color, delay = '0ms' }) => (
  <div
    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// ── Quick action card ────────────────────────────────────────────────────────
const QuickAction: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
  delay?: string;
}> = ({ to, icon, label, desc, color, delay = '0ms' }) => (
  <Link
    to={to}
    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-700 animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
    <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-orange-500" />
  </Link>
);

// ── Main page ────────────────────────────────────────────────────────────────
const POLL_MS = 30_000;

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback((silent = false) => {
    if (!silent) setLoading(true);
    ordersService.myOrders(1, 20)
      .then(res => { setOrders(res.data); setError(null); })
      .catch((e) => { if (!silent) setError((e as Error).message || 'Failed to load orders.'); })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  // Initial load
  useEffect(() => { load(false); }, [load]);

  // Poll every 30s so active order statuses stay current
  useEffect(() => {
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const total     = orders.length;
  const pending   = orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length;
  const completed = orders.filter(o => o.status === 'DELIVERED').length;
  // C4: total amount spent across all delivered orders
  const totalSpent = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const recent    = orders.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* C1: surface fetch errors with a retry option */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span>{error}</span>
          <button
            onClick={() => { setError(null); load(false); }}
            className="ml-4 rounded-lg bg-red-100 dark:bg-red-800 px-3 py-1 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Welcome banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Welcome back</span>
          </div>
          <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-orange-100">
            You have <span className="font-semibold text-white">{pending}</span> active order{pending !== 1 ? 's' : ''} right now.
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          label="Total Orders" value={loading ? '—' : total}
          color="bg-blue-100 dark:bg-blue-900/30" delay="0ms"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          label="Active Orders" value={loading ? '—' : pending}
          color="bg-amber-100 dark:bg-amber-900/30" delay="80ms"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          label="Delivered" value={loading ? '—' : completed}
          color="bg-emerald-100 dark:bg-emerald-900/30" delay="160ms"
        />
        {/* C4: total spent KPI */}
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
          label="Total Spent" value={loading ? '—' : formatRWF(totalSpent)}
          color="bg-violet-100 dark:bg-violet-900/30" delay="240ms"
        />
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickAction to="/account/orders"       icon={<Package className="h-5 w-5 text-violet-600" />}    label="My Orders"       desc="Track and manage your orders"       color="bg-violet-100 dark:bg-violet-900/30" delay="0ms"   />
          <QuickAction to="/account/addresses"    icon={<MapPin className="h-5 w-5 text-rose-600" />}       label="Addresses"       desc="Manage delivery addresses"          color="bg-rose-100 dark:bg-rose-900/30"     delay="60ms"  />
          <QuickAction to="/account/billing"      icon={<CreditCard className="h-5 w-5 text-blue-600" />}   label="Billing"         desc="View invoices and payments"         color="bg-blue-100 dark:bg-blue-900/30"     delay="120ms" />
          <QuickAction to="/account/notifications" icon={<Bell className="h-5 w-5 text-orange-600" />}      label="Notifications"   desc="Manage your notification settings"  color="bg-orange-100 dark:bg-orange-900/30" delay="180ms" />
        </div>
      </div>

      {/* ── Recent orders ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
          </div>
          <Link to="/account/orders"
            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:gap-2 transition-all duration-200 hover:text-orange-700">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <Package className="h-8 w-8 text-orange-300" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No orders yet</p>
            <p className="mt-1 text-sm text-slate-400">Discover amazing products from our vendors</p>
            <Link to="/shop"
              className="mt-4 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
              <Star className="h-4 w-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recent.map((order, i) => (
              <Link key={order.id} to={`/order/${order.id}`}
                className="group flex items-center justify-between py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 -mx-2 px-2 rounded-xl animate-in fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                {/* Thumbnail of first item */}
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 mr-3">
                  {(order.items[0]?.product?.images?.[0] ?? order.items[0]?.imageUrl) ? (
                    <img src={order.items[0].product?.images?.[0] ?? order.items[0].imageUrl} alt={order.items[0].productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {order.items.slice(0, 2).map(it => it.productName).join(', ')}
                    {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3 pl-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatRWF(order.total)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_COLOR[order.status as OrderStatus]}`}>
                    {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
