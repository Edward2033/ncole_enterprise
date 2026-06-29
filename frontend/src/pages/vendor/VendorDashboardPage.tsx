import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  vendorProductsService, vendorOrdersService, vendorProfileService,
  type NcoleVendorProduct, type NcoleVendorOrder,
} from '@/services/api';
import { PCard, PBadge, Spinner, PEmptyState } from '@/components/ui/portal-ui';
import { formatRWF, formatDate, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<NcoleVendorProduct[]>([]);
  const [orders, setOrders] = useState<NcoleVendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await vendorProfileService.getMyProfile();
        const vendorId = profile.data.id;
        const [pRes, oRes] = await Promise.all([
          vendorProductsService.list(1, 50, vendorId),
          vendorOrdersService.list(1, 20),
        ]);
        setProducts(pRes.data);
        setOrders(oRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const lowStock = products.filter(p => p.stockQty <= 5 && p.status === 'ACTIVE');
  const revenue = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'PENDING').length;

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here's an overview of your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: <DollarSign className="h-5 w-5 text-green-600" />, label: 'Total Revenue', value: formatRWF(revenue), bg: 'bg-green-100 dark:bg-green-900/30' },
          { icon: <ShoppingBag className="h-5 w-5 text-blue-600" />, label: 'Total Orders', value: orders.length, bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { icon: <Package className="h-5 w-5 text-purple-600" />, label: 'Active Products', value: activeProducts, bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { icon: <TrendingUp className="h-5 w-5 text-orange-600" />, label: 'Pending Orders', value: pending, bg: 'bg-orange-100 dark:bg-orange-900/30' },
        ].map(s => (
          <PCard key={s.label} className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
            <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-xl font-bold dark:text-white">{s.value}</p></div>
          </PCard>
        ))}
      </div>

      {lowStock.length > 0 && (
        <PCard className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Low Stock Alert ({lowStock.length})</h3>
          </div>
          <div className="mt-3 space-y-1">
            {lowStock.slice(0, 3).map(p => (
              <p key={p.id} className="text-sm text-orange-700 dark:text-orange-300">{p.name} — {p.stockQty} left</p>
            ))}
          </div>
        </PCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <PCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">Your Products</h2>
            <Link to="/vendor/products" className="flex items-center gap-1 text-xs text-violet-600">
              <ArrowRight className="h-3 w-3" />Manage
            </Link>
          </div>
          {products.length === 0 ? (
            <PEmptyState icon={<Package className="h-8 w-8 text-slate-300" />} title="No products yet"
              description="Your listed products will appear here." />
          ) : (
            products.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-slate-700">
                <p className="text-sm font-medium dark:text-white truncate max-w-[60%]">{p.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold dark:text-white">{formatRWF(p.basePrice)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.stockQty <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stockQty} left</span>
                </div>
              </div>
            ))
          )}
        </PCard>

        <PCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">Recent Orders</h2>
            <Link to="/vendor/orders" className="flex items-center gap-1 text-xs text-violet-600">
              <ArrowRight className="h-3 w-3" />View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <PEmptyState icon={<ShoppingBag className="h-8 w-8 text-slate-300" />} title="No orders yet"
              description="Orders containing your products will appear here." />
          ) : (
            orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-slate-700">
                <div><p className="text-sm font-medium dark:text-white">{o.orderNumber}</p><p className="text-xs text-slate-500">{formatDate(o.createdAt)}</p></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold dark:text-white">{formatRWF(o.total)}</span>
                  <PBadge className={ORDER_STATUS_COLOR[o.status as OrderStatus]}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</PBadge>
                </div>
              </div>
            ))
          )}
        </PCard>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
