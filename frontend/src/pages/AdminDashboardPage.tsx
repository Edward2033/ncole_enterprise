import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign, ShoppingBag, Users, Store, Package, Bike,
  TrendingUp, AlertTriangle, Clock, FolderOpen, CheckCircle, XCircle,
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

const GradCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; to: string; gradient: string }> = ({ icon, label, value, sub, to, gradient }) => (
  <Link to={to} className={`relative overflow-hidden rounded-2xl p-4 text-white transition hover:shadow-lg hover:-translate-y-0.5 ${gradient}`}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 flex-shrink-0">{icon}</div>
    </div>
    <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
  </Link>
);

const SkeletonCard = () => (
  <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 p-4 animate-pulse h-24" />
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-2.5 animate-pulse">
    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [orders,     setOrders]     = useState<AdminOrder[]>([]);
  const [products,   setProducts]   = useState<AdminProduct[]>([]);
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [vendors,    setVendors]    = useState<AdminVendor[]>([]);
  const [riders,     setRiders]     = useState<AdminRider[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [report,     setReport]     = useState<AdminRevenueReport | null>(null);
  const [pendingApps, setPendingApps] = useState(0);
  const [loading,    setLoading]    = useState(true);

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
  const recentOrders    = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
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

  const primaryStats = [
    { icon: <DollarSign className="h-5 w-5 text-white" />, label: 'Total Revenue',  value: fmtRWF(revenue),   sub: report?.count ? `${report.count} verified` : undefined, to: '/admin/billing',  gradient: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { icon: <ShoppingBag className="h-5 w-5 text-white" />, label: 'Total Orders',   value: orders.length,     sub: `${pendingOrders} pending`,  to: '/admin/orders',   gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: <Users className="h-5 w-5 text-white" />,       label: 'Customers',      value: customers,         sub: undefined,                   to: '/admin/users',    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: <Store className="h-5 w-5 text-white" />,       label: 'Vendors',        value: vendors.length,    sub: vendors.filter(v => !v.isVerified && v.isActive).length > 0 ? `${vendors.filter(v => !v.isVerified && v.isActive).length} unverified` : 'all verified', to: '/admin/vendors', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { icon: <Package className="h-5 w-5 text-white" />,     label: 'Products',       value: products.length,   sub: `${products.filter(p => p.status === 'ACTIVE').length} active`, to: '/admin/products', gradient: 'bg-gradient-to-br from-teal-500 to-teal-600' },
    { icon: <Bike className="h-5 w-5 text-white" />,        label: 'Riders',         value: riders.length,     sub: `${riders.filter(r => r.status === 'AVAILABLE').length} available`, to: '/admin/riders', gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
  ];

  const secondaryStats = [
    { icon: <CheckCircle className="h-4 w-4 text-green-600" />,  label: 'Delivered',   value: deliveredOrders,    bg: 'bg-green-100 dark:bg-green-900/30',   to: '/admin/orders' },
    { icon: <XCircle className="h-4 w-4 text-red-600" />,        label: 'Cancelled',   value: cancelledOrders,    bg: 'bg-red-100 dark:bg-red-900/30',     to: '/admin/orders' },
    { icon: <FolderOpen className="h-4 w-4 text-purple-600" />,  label: 'Categories',  value: categories.length,  bg: 'bg-purple-100 dark:bg-purple-900/30', to: '/admin/categories' },
    { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, label: 'Low Stock',  value: lowStock.length,    bg: 'bg-amber-100 dark:bg-amber-900/30',  to: '/admin/products' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Welcome back, <span className="font-semibold text-orange-600">{user?.name}</span>. Here's the live platform overview.
        </p>
      </div>

      {/* Pending application alert — sourced from real Application records */}
      {!loading && pendingApps > 0 && (
        <Link to="/admin/applications" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{pendingApps} application{pendingApps > 1 ? 's' : ''} awaiting review</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Click to review pending vendor &amp; rider applications</p>
          </div>
        </Link>
      )}

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : primaryStats.map(s => <GradCard key={s.label} {...s} />)}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondaryStats.map(s => (
          <Link key={s.label} to={s.to} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center gap-2 hover:border-orange-200 transition">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{loading ? '—' : s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" /> Revenue & Orders — Last 6 Months
          </h2>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="dRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.25} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                <linearGradient id="dOrd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, n: string) => [n === 'revenue' ? fmtRWF(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#dRev)" strokeWidth={2.5} dot={false} />
              <Area yAxisId="r" type="monotone" dataKey="orders"  stroke="#3b82f6" fill="url(#dOrd)" strokeWidth={2}   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-500" /> Orders by Status
          </h2>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={statusBreakdown} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>{statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" /> Recent Orders
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : recentOrders.length === 0
                ? <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>
                : recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400 truncate">{o.customer?.user.name ?? '—'} · {fmtDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtRWF(o.total)}</span>
                      {orderStatusBadge(o.status)}
                    </div>
                  </div>
                ))
            }
          </div>
          {!loading && orders.length > 0 && (
            <Link to="/admin/orders" className="mt-3 block text-center text-xs text-orange-500 hover:underline">View all orders →</Link>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Low stock */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock (≤5)
            </h2>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : lowStock.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">All products well-stocked</p>
                : <div className="space-y-2">
                    {lowStock.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{p.name}</p>
                        <span className={`text-xs font-bold flex-shrink-0 ${p.stockQty === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {p.stockQty === 0 ? 'Out' : p.stockQty}
                        </span>
                      </div>
                    ))}
                    {lowStock.length > 5 && <p className="text-xs text-slate-400 text-center">+{lowStock.length - 5} more</p>}
                  </div>
            }
          </div>

          {/* Recent customers */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> New Customers
            </h2>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : recentCustomers.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">No customers yet</p>
                : <div className="space-y-2.5">
                    {recentCustomers.map(u => (
                      <div key={u.id} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
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
  );
};

export default AdminDashboardPage;
