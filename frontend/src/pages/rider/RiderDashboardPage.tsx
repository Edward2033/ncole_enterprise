import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, CheckCircle, Clock, DollarSign, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { deliveriesService, type NcoleDelivery } from '@/services/api';
import { PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDateTime, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

const RiderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<NcoleDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // R7: fetch more than the default 20 so the dashboard shows a full picture
    deliveriesService.getAssigned(1, 100)
      .then(res => setItems(res.data))
      .catch(e => setError((e as Error).message || 'Could not load deliveries.'))
      .finally(() => setLoading(false));
  }, []);

  const assigned = items.filter(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_PICKUP');
  const completed = items.filter(o => o.status === 'DELIVERED');
  const pending = items.filter(o => o.status === 'READY_FOR_PICKUP');
  const earnings = completed.reduce((s, o) => s + o.deliveryFee, 0);

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  // R5: show a friendly message when the rider has no profile yet (403 from backend)
  if (error) return (
    <div className="flex flex-col items-center pt-16 gap-3 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <p className="text-xs text-slate-400">If you were recently registered as a rider, please wait for admin activation.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold dark:text-white">Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">Here are your deliveries.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Truck className="h-5 w-5 text-blue-600" />, label: 'Assigned', value: assigned.length, bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { icon: <Clock className="h-5 w-5 text-orange-600" />, label: 'Awaiting Pickup', value: pending.length, bg: 'bg-orange-100 dark:bg-orange-900/30' },
          { icon: <CheckCircle className="h-5 w-5 text-green-600" />, label: 'Completed', value: completed.length, bg: 'bg-green-100 dark:bg-green-900/30' },
          { icon: <DollarSign className="h-5 w-5 text-purple-600" />, label: 'Earnings', value: formatRWF(earnings), bg: 'bg-purple-100 dark:bg-purple-900/30' },
        ].map(s => (
          <PCard key={s.label} className="flex items-center gap-3 p-4">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold dark:text-white">{s.value}</p>
            </div>
          </PCard>
        ))}
      </div>

      <PCard>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold dark:text-white">Active Deliveries</h2>
          <Link to="/rider/deliveries" className="flex items-center gap-1 text-xs text-orange-600">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {assigned.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No active deliveries.</p>
        ) : (
          assigned.slice(0, 3).map(order => (
            <Link key={order.id} to={`/rider/deliveries/${order.id}`}
              className="flex items-center justify-between py-3 border-b last:border-0 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium dark:text-white">{order.orderNumber}</p>
                <p className="text-xs text-slate-500">
                  {order.address ? `${order.address.district}, ${order.address.city}` : 'Address pending'}
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
                  {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                </PBadge>
                <span className="text-xs font-semibold text-orange-600">{formatRWF(order.deliveryFee)}</span>
              </div>
            </Link>
          ))
        )}
      </PCard>
    </div>
  );
};

export default RiderDashboardPage;
