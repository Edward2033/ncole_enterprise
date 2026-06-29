import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle, ArrowRight, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService, type NcoleOrder } from '@/services/api';
import { PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, type OrderStatus } from '@/lib/utils';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string }> = ({
  icon, label, value, color,
}) => (
  <PCard className="flex items-center gap-4">
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </PCard>
);

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersService.myOrders(1, 20)
      .then(res => setOrders(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const total = orders.length;
  const pending = orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length;
  const completed = orders.filter(o => o.status === 'DELIVERED').length;
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening with your orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<ShoppingBag className="h-6 w-6 text-blue-600" />} label="Total Orders" value={total} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard icon={<Clock className="h-6 w-6 text-yellow-600" />} label="Pending" value={pending} color="bg-yellow-100 dark:bg-yellow-900/30" />
        <StatCard icon={<CheckCircle className="h-6 w-6 text-green-600" />} label="Completed" value={completed} color="bg-green-100 dark:bg-green-900/30" />
      </div>

      <PCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
          <Link to="/account/orders" className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No orders yet</p>
            <Link to="/" className="mt-3 text-sm font-medium text-orange-600 hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recent.map(order => (
              <Link key={order.id} to={`/order/${order.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 -mx-2 px-2 rounded-lg transition">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatRWF(order.total)}</span>
                  <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
                    {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                  </PBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PCard>
    </div>
  );
};

export default CustomerDashboardPage;
