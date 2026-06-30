import React, { useEffect, useState } from 'react';
import { vendorOrdersService, vendorProductsService, vendorProfileService, type NcoleVendorOrder, type NcoleVendorProduct } from '@/services/api';
import { PCard, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, type OrderStatus } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const VendorAnalyticsPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleVendorOrder[]>([]);
  const [products, setProducts] = useState<NcoleVendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await vendorProfileService.getMyProfile();
      const [oRes, pRes] = await Promise.all([
        vendorOrdersService.list(1, 100),
        vendorProductsService.list(1, 100, profile.data.id),
      ]);
      setOrders(oRes.data);
      setProducts(pRes.data);
    } catch (e) {
      setError((e as Error).message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const targetMonth = d.getMonth();
    const targetYear  = d.getFullYear();
    const month = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const revenue = orders
      .filter(o => {
        const od = new Date(o.createdAt);
        return o.status === 'DELIVERED'
          && od.getMonth() === targetMonth
          && od.getFullYear() === targetYear;
      })
      .reduce((s, o) => s + o.total, 0);
    return { month, revenue };
  });

  const statusBreakdown = (['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(status => ({
    status, count: orders.filter(o => o.status === status).length,
  }));

  // V3 fix: sort by revenue contribution (items sold × price), not raw stock
  const productRevenue = products.map(p => ({
    ...p,
    revenue: orders
      .filter(o => o.status === 'DELIVERED')
      .flatMap(o => o.items)
      .filter(i => i.productId === p.id)
      .reduce((s, i) => s + i.total, 0),
  }));
  const topProducts = [...productRevenue].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  // V2 fix: scale bar width relative to the max revenue, not raw stock value
  const maxRevenue = topProducts.reduce((m, p) => Math.max(m, p.revenue), 1);

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  if (error) return (
    <div className="flex flex-col items-center pt-16 gap-4 text-center">
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={load} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Analytics</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <PCard>
          <h2 className="mb-4 font-semibold dark:text-white">Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => formatRWF(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </PCard>
        <PCard>
          <h2 className="mb-4 font-semibold dark:text-white">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PCard>
      </div>
      <PCard>
        <h2 className="mb-4 font-semibold dark:text-white">Top Products by Revenue</h2>
        {topProducts.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No delivered orders yet.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <p className="w-40 truncate text-sm dark:text-white">{p.name}</p>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${Math.round((p.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-24 text-right">{formatRWF(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </PCard>
    </div>
  );
};

export default VendorAnalyticsPage;
