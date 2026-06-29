import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingBag, TrendingUp, AlertTriangle,
  ArrowRight, DollarSign, Sparkles, BarChart2,
  CheckCircle, Clock, Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  vendorProductsService, vendorOrdersService, vendorProfileService,
  type NcoleVendorProduct, type NcoleVendorOrder,
} from '@/services/api';
import { PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDate, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

// ── Animated KPI card ─────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  bg: string; delay?: string;
}> = ({ icon, label, value, bg, delay = '0ms' }) => (
  <div
    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// ── Quick action ──────────────────────────────────────────────────────────────
const QuickLink: React.FC<{
  to: string; icon: React.ReactNode; label: string; color: string; delay?: string;
}> = ({ to, icon, label, color, delay = '0ms' }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 animate-in fade-in"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color} transition-transform duration-200 group-hover:scale-110`}>
      {icon}
    </div>
    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-violet-500" />
  </Link>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<NcoleVendorProduct[]>([]);
  const [orders,   setOrders]   = useState<NcoleVendorOrder[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await vendorProfileService.getMyProfile();
        const [pRes, oRes] = await Promise.all([
          vendorProductsService.list(1, 50, profile.data.id),
          vendorOrdersService.list(1, 20),
        ]);
        setProducts(pRes.data);
        setOrders(oRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const lowStock       = products.filter(p => p.stockQty <= 5 && p.status === 'ACTIVE');
  const revenue        = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const pending        = orders.filter(o => o.status === 'PENDING').length;
  const delivered      = orders.filter(o => o.status === 'DELIVERED').length;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-6 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 animate-in fade-in slide-in-from-top-4 duration-500"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-violet-200 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Vendor Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-violet-200">
            You have <span className="font-semibold text-white">{pending}</span> pending order{pending !== 1 ? 's' : ''} waiting for confirmation.
          </p>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={<DollarSign className="h-5 w-5 text-emerald-600" />}  label="Total Revenue"    value={formatRWF(revenue)}   bg="bg-emerald-100 dark:bg-emerald-900/30" delay="0ms"   />
        <KpiCard icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}    label="Total Orders"     value={orders.length}         bg="bg-blue-100 dark:bg-blue-900/30"       delay="60ms"  />
        <KpiCard icon={<Package className="h-5 w-5 text-violet-600" />}      label="Active Products"  value={activeProducts}         bg="bg-violet-100 dark:bg-violet-900/30"   delay="120ms" />
        <KpiCard icon={<TrendingUp className="h-5 w-5 text-orange-600" />}   label="Delivered"        value={delivered}              bg="bg-orange-100 dark:bg-orange-900/30"   delay="180ms" />
      </div>

      {/* ── Low stock alert ───────────────────────────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 p-5 animate-in fade-in duration-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-orange-700 dark:text-orange-300">
              Low Stock Alert — {lowStock.length} product{lowStock.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{p.name}</span>
                <span className={`text-xs font-bold ${p.stockQty === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {p.stockQty === 0 ? 'Out!' : `${p.stockQty} left`}
                </span>
              </div>
            ))}
          </div>
          <Link to="/vendor/products" className="self-start text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline">
            Manage stock →
          </Link>
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink to="/vendor/products"      icon={<Package className="h-4 w-4 text-violet-600" />}  label="Products"      color="bg-violet-100 dark:bg-violet-900/30" delay="0ms"   />
          <QuickLink to="/vendor/orders"        icon={<ShoppingBag className="h-4 w-4 text-blue-600" />} label="Orders"        color="bg-blue-100 dark:bg-blue-900/30"    delay="50ms"  />
          <QuickLink to="/vendor/analytics"     icon={<BarChart2 className="h-4 w-4 text-emerald-600" />} label="Analytics"   color="bg-emerald-100 dark:bg-emerald-900/30" delay="100ms" />
          <QuickLink to="/vendor/notifications" icon={<Bell className="h-4 w-4 text-orange-600" />}      label="Notifications" color="bg-orange-100 dark:bg-orange-900/30" delay="150ms" />
        </div>
      </div>

      {/* ── Recent products + orders ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Products */}
        <PCard className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' } as React.CSSProperties}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-500" />
              <h2 className="font-semibold dark:text-white">Your Products</h2>
            </div>
            <Link to="/vendor/products" className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:gap-2 transition-all duration-200">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Package className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No products yet</p>
              <Link to="/vendor/products" className="mt-3 text-sm font-semibold text-violet-600 hover:underline">Add your first product →</Link>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
              {products.slice(0, 5).map((p, i) => (
                <div key={p.id}
                  className="flex items-center justify-between py-3 animate-in fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku ?? p.slug}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 pl-3">
                    <span className="text-sm font-bold dark:text-white">{formatRWF(p.basePrice)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold
                      ${p.stockQty === 0 ? 'bg-red-100 text-red-600' : p.stockQty <= 5 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stockQty === 0 ? 'Out' : `${p.stockQty}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PCard>

        {/* Orders */}
        <PCard className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '260ms', animationFillMode: 'both' } as React.CSSProperties}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold dark:text-white">Recent Orders</h2>
            </div>
            <Link to="/vendor/orders" className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:gap-2 transition-all duration-200">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingBag className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
              {orders.slice(0, 5).map((o, i) => (
                <div key={o.id}
                  className="flex items-center justify-between py-3 animate-in fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium dark:text-white">{o.orderNumber}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.createdAt)} · {o.items.length} items</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 pl-3">
                    <span className="text-sm font-bold dark:text-white">{formatRWF(o.total)}</span>
                    <PBadge className={ORDER_STATUS_COLOR[o.status as OrderStatus]}>
                      {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                    </PBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PCard>
      </div>

      {/* ── Order status summary ───────────────────────────────────────────── */}
      {orders.length > 0 && (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          {[
            { label: 'Pending',   count: orders.filter(o => o.status === 'PENDING').length,    icon: <Clock className="h-4 w-4 text-amber-600" />,   bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300' },
            { label: 'Processing',count: orders.filter(o => ['CONFIRMED','PROCESSING'].includes(o.status)).length, icon: <Package className="h-4 w-4 text-violet-600" />, bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300' },
            { label: 'Delivered', count: delivered,                                             icon: <CheckCircle className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
            { label: 'Total',     count: orders.length,                                         icon: <ShoppingBag className="h-4 w-4 text-blue-600" />,   bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-300' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl ${s.bg} p-4 border border-white/50 dark:border-slate-700`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className={`text-xs font-semibold ${s.text}`}>{s.label}</span></div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDashboardPage;
