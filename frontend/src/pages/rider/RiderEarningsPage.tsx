import React, { useEffect, useState } from 'react';
import { deliveriesService, type NcoleDelivery } from '@/services/api';
import { PCard, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDate } from '@/lib/utils';

const RiderEarningsPage: React.FC = () => {
  const [items, setItems] = useState<NcoleDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveriesService.getAssigned()
      .then(res => setItems(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const completed = items.filter(o => o.status === 'DELIVERED');
  const totalEarnings = completed.reduce((s, o) => s + o.deliveryFee, 0);

  const byMonth = completed.reduce<Record<string, number>>((acc, o) => {
    const month = new Date(o.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    acc[month] = (acc[month] ?? 0) + o.deliveryFee;
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-white">Earnings</h1>

      <div className="grid grid-cols-2 gap-3">
        <PCard>
          <p className="text-xs text-slate-500">Total Earnings</p>
          <p className="text-2xl font-bold text-orange-600">{formatRWF(totalEarnings)}</p>
        </PCard>
        <PCard>
          <p className="text-xs text-slate-500">Deliveries Done</p>
          <p className="text-2xl font-bold dark:text-white">{completed.length}</p>
        </PCard>
      </div>

      {Object.keys(byMonth).length > 0 && (
        <PCard>
          <h2 className="mb-3 font-semibold dark:text-white">Monthly Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(byMonth).map(([month, amount]) => (
              <div key={month} className="flex justify-between border-b pb-2 last:border-0 dark:border-slate-700 text-sm">
                <span className="text-slate-600 dark:text-slate-300">{month}</span>
                <span className="font-semibold dark:text-white">{formatRWF(amount)}</span>
              </div>
            ))}
          </div>
        </PCard>
      )}

      <PCard>
        <h2 className="mb-3 font-semibold dark:text-white">Recent Payouts</h2>
        {completed.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No completed deliveries yet.</p>
        ) : (
          completed.slice(0, 10).map(o => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-slate-700 text-sm">
              <div>
                <p className="font-medium dark:text-white">{o.orderNumber}</p>
                <p className="text-xs text-slate-400">{formatDate(o.createdAt)}</p>
              </div>
              <span className="font-semibold text-green-600">+{formatRWF(o.deliveryFee)}</span>
            </div>
          ))
        )}
      </PCard>
    </div>
  );
};

export default RiderEarningsPage;
