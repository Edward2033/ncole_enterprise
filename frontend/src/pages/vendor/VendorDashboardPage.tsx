import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingBag, TrendingUp, AlertTriangle, ArrowRight,
  DollarSign, Sparkles, BarChart2, CheckCircle, Clock, Bell,
  ArrowUpRight, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  vendorProductsService, vendorOrdersService, vendorProfileService,
  type NcoleVendorProduct, type NcoleVendorOrder,
} from '@/services/api';
import { PBadge, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDate, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; gradient: string; delay?: string;
}> = ({ icon, label, value, sub, gradient, delay = '0ms' }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${gradient}`}
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none sm:text-3xl">{value}</p>
        {sub && <p className="mt-1.5 text-xs opacity-70">{sub}</p>}
      </div>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
    </div>
    <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
    <div className="pointer-events-none absolute -top-2 right-10 h-10 w-10 rounded-full bg-white/5" />
  </div>
);

// ─── Quick action link ────────────────────────────────────────────────────────
const QuickLink: React.FC<{
  to: string; icon: React.ReactNode; label: string; color: string; delay?: string;
}> = ({ to, icon, label, color, delay = '0ms' }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color} transition-transform duration-200 group-hover:scale-110`}>
      {icon}
    </div>
    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-violet-500" />
  </Link>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 animate-pulse">
    <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<NcoleVendorProduct[]>([]);
  const [orders,   setOrders]   = useState<NcoleVendorOrder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const profile = await vendorProfileService.getMyProfile();
      const [pRes, oRes] = await Promise.all([
        vendorProductsService.list(1, 50, profile.data.id),
        vendorOrdersService.list(1, 20),
      ]);
      setProducts(pRes.data);
      setOrders(oRes.data);
    } catch (e) {
      setError((e as Error).message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const lowStock       = products.filter(p => p.stockQty <= 5 && p.status === 'ACTIVE');
  const revenue        = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const pending        = orders.filter(o => o.status === 'PENDING').length;
  const delivered      = orders.filter(o => o.status === 'DELIVERED').length;
  const processing     = orders.filter(o => ['CONFIRMED', 'PROCESSING'].includes(o.status)).length;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={load} className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition">
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-6 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">
              <Sparkles className="h-3.5 w-3.5" /> Vendor Portal
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-violet-200">
              {pending > 0
                ? <><span className="font-bold text-white">{pending}</span> pending order{pending !== 1 ? 's' : ''} need your attention.</>
                : 'All orders are up to date. Great work!'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/vendor/products"
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition backdrop-blur-sm">
              <Package className="h-3.5 w-3.5" /> Products
            </Link>
            <Link to="/vendor/orders"
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition backdrop-blur-sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Orders
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-white" />}
          label="Total Revenue" value={formatRWF(revenue)}
          sub={`${delivered} delivered orders`}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay="0ms"
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5 text-white" />}
          label="Total Orders" value={orders.length}
          sub={`${pending} pending`}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          delay="60ms"
        />
        <KpiCard
          icon={<Package className="h-5 w-5 text-white" />}
          label="Active Products" value={activeProducts}
          sub={`${products.length} total`}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          delay="120ms"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          label="Delivered" value={delivered}
          sub={`${processing} processing`}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          delay="180ms"
        />
      </div>

      {/* ── Order status strip ─────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Pending',    count: pending,    icon: <Clock className="h-4 w-4 text-amber-600" />,    bg: 'bg-amber-50 dark:bg-amber-900/20',    border: 'border-amber-200 dark:border-amber-800',    text: 'text-amber-700 dark:text-amber-300' },
            { label: 'Processing', count: processing, icon: <Package className="h-4 w-4 text-violet-600" />, bg: 'bg-violet-50 dark:bg-violet-900/20',  border: 'border-violet-200 dark:border-violet-800',  text: 'text-violet-700 dark:text-violet-300' },
            { label: 'Delivered',  count: delivered,  icon: <CheckCircle className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
            { label: 'Total',      count: orders.length, icon: <ShoppingBag className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1.5">{s.icon}<span className={`text-xs font-semibold ${s.text}`}>{s.label}</span></div>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Low stock alert ────────────────────────────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-bold text-orange-700 dark:text-orange-300 text-sm">
                Low Stock Alert — {lowStock.length} product{lowStock.length > 1 ? 's' : ''}
              </h3>
            </div>
            <Link to="/vendor/products" className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{p.name}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${p.stockQty === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {p.stockQty === 0 ? 'Out!' : `${p.stockQty} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink to="/vendor/products"      icon={<Package className="h-4 w-4 text-violet-600" />}     label="Products"      color="bg-violet-100 dark:bg-violet-900/30" delay="0ms" />
          <QuickLink to="/vendor/orders"        icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}   label="Orders"        color="bg-blue-100 dark:bg-blue-900/30"    delay="50ms" />
          <QuickLink to="/vendor/analytics"     icon={<BarChart2 className="h-4 w-4 text-emerald-600" />}  label="Analytics"     color="bg-emerald-100 dark:bg-emerald-900/30" delay="100ms" />
          <QuickLink to="/vendor/notifications" icon={<Bell className="h-4 w-4 text-orange-600" />}        label="Notifications" color="bg-orange-100 dark:bg-orange-900/30" delay="150ms" />
        </div>
      </div>

      {/* ── Products + Orders panels ───────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Products panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-500" /> Your Products
            </h2>
            <Link to="/vendor/products" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30 mb-3">
                <Package className="h-7 w-7 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No products yet</p>
              <p className="mt-1 text-xs text-slate-400">Add your first product to start selling</p>
              <Link to="/vendor/products" className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition">
                Add Product
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {products.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku ?? p.slug}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatRWF(p.basePrice)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.stockQty === 0
                        ? 'bg-red-100 text-red-600'
                        : p.stockQty <= 5
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stockQty === 0 ? 'Out' : p.stockQty}
                    </span>
                  </div>
                </div>
              ))}
              {products.length > 6 && (
                <div className="px-5 py-3 text-center">
                  <Link to="/vendor/products" className="text-xs font-semibold text-violet-600 hover:underline">
                    View all {products.length} products →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" /> Recent Orders
            </h2>
            <Link to="/vendor/orders" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                <ShoppingBag className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No orders yet</p>
              <p className="mt-1 text-xs text-slate-400">Orders will appear here once customers purchase</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {orders.slice(0, 6).map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatRWF(o.total)}</span>
                    <PBadge className={ORDER_STATUS_COLOR[o.status as OrderStatus]}>
                      {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                    </PBadge>
                  </div>
                </div>
              ))}
              {orders.length > 6 && (
                <div className="px-5 py-3 text-center">
                  <Link to="/vendor/orders" className="text-xs font-semibold text-violet-600 hover:underline">
                    View all {orders.length} orders →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
