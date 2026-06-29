import React, { useEffect, useState } from 'react';
import { vendorOrdersService, vendorProductsService, vendorProfileService, type NcoleVendorOrder, type NcoleVendorProduct } from '@/services/api';
import { PCard, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, type OrderStatus } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const VendorAnalyticsPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleVendorOrder[]>([]);
  const [products, setProducts] = useState<NcoleVendorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await vendorProfileService.getMyProfile();
        const [oRes, pRes] = await Promise.all([
          vendorOrdersService.list(1, 100),
          vendorProductsService.list(1, 100, profile.data.id),
        ]);
        setOrders(oRes.data);
        setProducts(pRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const revenue = orders
      .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).getMonth() === d.getMonth())
      .reduce((s, o) => s + o.total, 0);
    return { month, revenue };
  });

  const statusBreakdown = (['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(status => ({
    status, count: orders.filter(o => o.status === status).length,
  }));

  const topProducts = [...products].sort((a, b) => b.stockQty - a.stockQty).slice(0, 5);

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

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
        <h2 className="mb-4 font-semibold dark:text-white">Products by Stock</h2>
        <div className="space-y-2">
          {topProducts.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <p className="w-40 truncate text-sm dark:text-white">{p.name}</p>
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.min(100, p.stockQty)}%` }} />
              </div>
              <span className="text-sm text-slate-500 w-10 text-right">{p.stockQty}</span>
            </div>
          ))}
        </div>
      </PCard>
    </div>
  );
};

export default VendorAnalyticsPage;
