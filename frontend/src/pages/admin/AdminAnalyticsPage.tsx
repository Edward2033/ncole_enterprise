import React, { useEffect, useState } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminOrdersApi, adminProductsApi, adminUsersApi, adminBillingApi, type AdminOrder, type AdminProduct, type AdminUser, type AdminRevenueReport } from '@/services/adminApi';
import { fmtRWF } from '@/lib/adminFormat';

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4'];

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 ${className}`}>
    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const Skeleton = () => <div className="h-56 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />;

const AdminAnalyticsPage: React.FC = () => {
  const [orders, setOrders]       = useState<AdminOrder[]>([]);
  const [products, setProducts]   = useState<AdminProduct[]>([]);
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [report, setReport]       = useState<AdminRevenueReport | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [oRes, pRes, uRes, rRes] = await Promise.all([
        adminOrdersApi.list(1, 100),
        adminProductsApi.list({ page: 1, limit: 100 }),
        adminUsersApi.list(1, 100),
        adminBillingApi.revenueReport(),
      ]);
      setOrders(oRes.data);
      setProducts(pRes.data);
      setUsers(uRes.data);
      setReport(rRes.data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Monthly revenue & orders — last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const rev = orders
      .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear())
      .reduce((s, o) => s + o.total, 0);
    const count = orders.filter(o => new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).length;
    return { month, revenue: rev, orders: count };
  });

  // Order status breakdown
  const statusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'PENDING').length },
    { name: 'Confirmed', value: orders.filter(o => o.status === 'CONFIRMED').length },
    { name: 'Processing', value: orders.filter(o => o.status === 'PROCESSING').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length },
  ].filter(d => d.value > 0);

  // User role breakdown
  const roleData = [
    { name: 'Customers', value: users.filter(u => u.role === 'CUSTOMER').length },
    { name: 'Vendors',   value: users.filter(u => u.role === 'VENDOR').length },
    { name: 'Riders',    value: users.filter(u => u.role === 'RIDER').length },
    { name: 'Admins',    value: users.filter(u => u.role === 'ADMIN').length },
  ];

  // Product status
  const productStatus = [
    { name: 'Active',   value: products.filter(p => p.status === 'ACTIVE').length },
    { name: 'Draft',    value: products.filter(p => p.status === 'DRAFT').length },
    { name: 'Archived', value: products.filter(p => p.status === 'ARCHIVED').length },
  ].filter(d => d.value > 0);

  // Revenue by gateway
  const gatewayData = report ? Object.entries(report.byGateway).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })) : [];

  // Low stock products (top 8)
  const lowStock = [...products].filter(p => p.status === 'ACTIVE').sort((a, b) => a.stockQty - b.stockQty).slice(0, 8).map(p => ({ name: p.name.slice(0, 20), stock: p.stockQty }));

  const kpis = [
    { label: 'Total Revenue', value: fmtRWF(report?.totalRevenue ?? 0), color: 'text-orange-600' },
    { label: 'Total Orders', value: orders.length, color: 'text-blue-600' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length, color: 'text-green-600' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length, color: 'text-red-600' },
    { label: 'Total Users', value: users.length, color: 'text-purple-600' },
    { label: 'Active Products', value: products.filter(p => p.status === 'ACTIVE').length, color: 'text-teal-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-slate-500">Platform performance overview</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
            <p className={`text-xl font-bold ${k.color}`}>{loading ? '—' : k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <Card title="Revenue — Last 6 Months" className="lg:col-span-2">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, n: string) => [n === 'revenue' ? fmtRWF(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revGrad)" strokeWidth={2.5} dot={false} />
                <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" fill="url(#ordGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Order status pie */}
        <Card title="Order Status Distribution">
          {loading ? <Skeleton /> : statusData.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">No order data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: { name: string; value: number }) => `${name} (${value})`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* User roles */}
        <Card title="Users by Role">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Revenue by gateway */}
        <Card title="Revenue by Payment Gateway">
          {loading ? <Skeleton /> : gatewayData.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">No verified payments yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gatewayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => fmtRWF(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Product status */}
        <Card title="Product Status Breakdown">
          {loading ? <Skeleton /> : productStatus.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">No product data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={productStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: { name: string; value: number }) => `${name} (${value})`} labelLine={false}>
                  {productStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Low stock */}
        <Card title="Low Stock Alert">
          {loading ? <Skeleton /> : lowStock.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">All products are well-stocked</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lowStock} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="stock" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
