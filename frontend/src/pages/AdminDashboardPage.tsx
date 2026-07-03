import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign, ShoppingBag, Users, Store, Package, Bike,
  TrendingUp, AlertTriangle, Clock, FolderOpen, CheckCircle,
  XCircle, ArrowUpRight, Sparkles, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  adminOrdersApi, adminProductsApi, adminUsersApi, adminVendorsApi,
  adminRidersApi, adminBillingApi, adminCategoriesApi, adminApplicationsApi,
  type AdminOrder, type AdminProduct, type AdminUser, type AdminVendor,
  type AdminRider, type AdminRevenueReport, type AdminCategory,
} from '@/services/adminApi';
import { fmtRWF, fmtDate } from '@/lib/adminFormat';
import { orderStatusBadge } from '@/components/admin/AdminBadge';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready', OUT_FOR_DELIVERY: 'Delivering',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; to: string; gradient: string; trend?: string;
}> = ({ icon, label, value, sub, to, gradient, trend }) => (
  <Link to={to} className={`group relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${gradient}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none sm:text-3xl">{value}</p>
        {sub && <p className="mt-1.5 text-xs opacity-70">{sub}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold opacity-90">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </div>
        )}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
    </div>
    {/* Decorative circles */}
    <div className="pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 rounded-full bg-white/10" />
    <div className="pointer-events-none absolute -top-3 right-12 h-12 w-12 rounded-full bg-white/5" />
  </Link>
);

// ─── Stat mini card ───────────────────────────────────────────────────────────
const MiniStat: React.FC<{
  icon: React.ReactNode; label: string; value: number | string;
  bg: string; to: string;
}> = ({ icon, label, value, bg, to }) => (
  <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-all hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800">
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </Link>
);

// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonCard = () => <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse h-28" />;
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 animate-pulse">
    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [orders,      setOrders]      = useState<AdminOrder[]>([]);
  const [products,    setProducts]    = useState<AdminProduct[]>([]);
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [vendors,     setVendors]     = useState<AdminVendor[]>([]);
  const [riders,      setRiders]      = useState<AdminRider[]>([]);
  const [categories,  setCategories]  = useState<AdminCategory[]>([]);
  const [report,      setReport]      = useState<AdminRevenueReport | null>(null);
  const [pendingApps, setPendingApps] = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      adminOrdersApi.list(1, 100).then(r => setOrders(r.data)).catch(() => null),
      adminProductsApi.list({ limit: 100 }).then(r => setProducts(r.data)).catch(() => null),
      adminUsersApi.list(1, 100).then(r => setUsers(r.data)).catch(() => null),
      adminVendorsApi.list().then(r => setVendors(r.data)).catch(() => null),
      adminRidersApi.list().then(r => setRiders(r.data)).catch(() => null),
      adminCategoriesApi.list().then(r => setCategories(r.data)).catch(() => null),
      adminBillingApi.revenueReport().then(r => setReport(r.data)).catch(() => null),
      adminApplicationsApi.list('PENDING').then(r => setPendingApps(r.data.length)).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  const revenue         = report?.totalRevenue ?? 0;
  const pendingOrders   = orders.filter(o => o.status === 'PENDING').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
  const customers       = users.filter(u => u.role === 'CUSTOMER').length;
  const lowStock        = products.filter(p => p.status === 'ACTIVE' && p.stockQty <= 5);
  const recentOrders    = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const recentCustomers = [...users].filter(u => u.role === 'CUSTOMER').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const rev   = orders.filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).reduce((s, o) => s + o.total, 0);
    const count = orders.filter(o => new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).length;
    return { month, revenue: rev, orders: count };
  });

  const statusBreakdown = (['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'] as const).map((s, i) => ({
    name: STATUS_LABEL[s], value: orders.filter(o => o.status === s).length,
    color: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'][i],
  }));

  const kpis = [
    { icon: <DollarSign className="h-6 w-6 text-white" />, label: 'Total Revenue',  value: fmtRWF(revenue),  sub: report?.count ? `${report.count} verified payments` : 'No payments yet', to: '/admin/billing',   gradient: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { icon: <ShoppingBag className="h-6 w-6 text-white" />, label: 'Total Orders',  value: orders.length,    sub: `${pendingOrders} pending confirmation`,                                  to: '/admin/orders',    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: <Users className="h-6 w-6 text-white" />,       label: 'Customers',     value: customers,        sub: `${users.length} total users`,                                            to: '/admin/users',     gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: <Store className="h-6 w-6 text-white" />,       label: 'Vendors',       value: vendors.length,   sub: `${vendors.filter(v => v.isVerified).length} verified`,                   to: '/admin/vendors',   gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { icon: <Package className="h-6 w-6 text-white" />,     label: 'Products',      value: products.length,  sub: `${products.filter(p => p.status === 'ACTIVE').length} active`,           to: '/admin/products',  gradient: 'bg-gradient-to-br from-teal-500 to-teal-600' },
    { icon: <Bike className="h-6 w-6 text-white" />,        label: 'Riders',        value: riders.length,    sub: `${riders.filter(r => r.status === 'AVAILABLE').length} available`,       to: '/admin/riders',    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
  ];

  const miniStats = [
    { icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,  label: 'Delivered',  value: deliveredOrders, bg: 'bg-emerald-100 dark:bg-emerald-900/30', to: '/admin/orders' },
    { icon: <XCircle className="h-4 w-4 text-red-600" />,          label: 'Cancelled',  value: cancelledOrders, bg: 'bg-red-100 dark:bg-red-900/30',         to: '/admin/orders' },
    { icon: <FolderOpen className="h-4 w-4 text-purple-600" />,    label: 'Categories', value: categories.length, bg: 'bg-purple-100 dark:bg-purple-900/30', to: '/admin/categories' },
    { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,  label: 'Low Stock',  value: lowStock.length, bg: 'bg-amber-100 dark:bg-amber-900/30',     to: '/admin/products' },
  ];

  return (
    <div className="space-y-7">

      {/* ── Welcome header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Admin Portal
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Here's your live platform overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        <Link to="/admin/analytics"
          className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-300 transition">
          <Activity className="h-4 w-4 text-orange-500" /> Full Analytics
        </Link>
      </div>

      {/* ── Pending applications alert ─────────────────────────────────────── */}
      {!loading && pendingApps > 0 && (
        <Link to="/admin/applications"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700 px-5 py-4 hover:shadow-md transition">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              {pendingApps} application{pendingApps > 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Click to review pending vendor &amp; rider applications</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
        </Link>
      )}

      {/* ── Primary KPIs ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* ── Mini stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {miniStats.map(s => (
          <MiniStat key={s.label} {...s} />
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Revenue + Orders area chart */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" /> Revenue & Orders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-semibold text-orange-600">
              {fmtRWF(revenue)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, n: string) => [n === 'revenue' ? fmtRWF(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
              />
              <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#gRev)" strokeWidth={2.5} dot={false} />
              <Area yAxisId="r" type="monotone" dataKey="orders"  stroke="#3b82f6" fill="url(#gOrd)" strokeWidth={2}   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" /> Orders by Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{orders.length} total orders</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusBreakdown} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Recent orders table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" /> Recent Orders
            </h2>
            {!loading && orders.length > 0 && (
              <Link to="/admin/orders" className="text-xs font-semibold text-orange-500 hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5"><SkeletonRow /></div>
                ))
              : recentOrders.length === 0
                ? <p className="py-12 text-center text-sm text-slate-400">No orders yet</p>
                : recentOrders.map(o => (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{o.orderNumber}</p>
                          <p className="text-xs text-slate-400 truncate">{o.customer?.user.name ?? '—'} · {fmtDate(o.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{fmtRWF(o.total)}</span>
                        {orderStatusBadge(o.status)}
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">

          {/* Low stock */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock
              </h2>
              {lowStock.length > 0 && (
                <Link to="/admin/products" className="text-xs font-semibold text-orange-500 hover:underline">
                  Manage
                </Link>
              )}
            </div>
            <div className="p-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                : lowStock.length === 0
                  ? <p className="py-4 text-center text-xs text-slate-400">All products well-stocked ✓</p>
                  : <div className="space-y-2.5">
                      {lowStock.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="h-7 w-7 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                            )}
                            <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{p.name}</p>
                          </div>
                          <span className={`text-xs font-bold flex-shrink-0 rounded-full px-2 py-0.5 ${
                            p.stockQty === 0
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.stockQty === 0 ? 'Out' : `${p.stockQty} left`}
                          </span>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <p className="text-xs text-slate-400 text-center pt-1">+{lowStock.length - 5} more</p>
                      )}
                    </div>
              }
            </div>
          </div>

          {/* New customers */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> New Customers
              </h2>
              <Link to="/admin/users" className="text-xs font-semibold text-orange-500 hover:underline">
                View all
              </Link>
            </div>
            <div className="p-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                : recentCustomers.length === 0
                  ? <p className="py-4 text-center text-xs text-slate-400">No customers yet</p>
                  : <div className="space-y-3">
                      {recentCustomers.map(u => (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{fmtDate(u.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
