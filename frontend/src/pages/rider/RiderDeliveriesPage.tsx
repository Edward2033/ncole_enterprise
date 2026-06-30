import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowRight, ChevronDown } from 'lucide-react';
import { deliveriesService, type NcoleDelivery } from '@/services/api';
import { PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDateTime, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

const RiderDeliveriesPage: React.FC = () => {
  const [items, setItems] = useState<NcoleDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = (p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    deliveriesService.getAssigned(p, 20)
      .then(res => {
        setItems(prev => reset ? res.data : [...prev, ...res.data]);
        setHasMore(res.data.length === 20);
        setPage(p);
      })
      .catch(() => null)
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { loadPage(1, true); }, []);

  const active = items.filter(o => ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status));
  const history = items.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  const DeliveryCard = ({ order }: { order: NcoleDelivery }) => (
    <Link to={`/rider/deliveries/${order.id}`}>
      <PCard className="mb-3 hover:border-orange-300 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-sm dark:text-white">{order.orderNumber}</p>
              {order.address && (
                <p className="text-xs text-slate-500 mt-0.5">{order.address.fullName} · {order.address.phone}</p>
              )}
              {order.address && (
                <p className="text-xs text-slate-400">{order.address.street}, {order.address.district}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
              {ORDER_STATUS_LABEL[order.status as OrderStatus]}
            </PBadge>
            <span className="text-sm font-bold text-orange-600">{formatRWF(order.deliveryFee)}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </PCard>
    </Link>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-white">Deliveries</h1>

      {active.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Active ({active.length})</h2>
          {active.map(o => <DeliveryCard key={o.id} order={o} />)}
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">History</h2>
          {history.map(o => <DeliveryCard key={o.id} order={o} />)}
        </section>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Truck className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No deliveries assigned yet.</p>
        </div>
      )}

      {/* R7: load-more button */}
      {hasMore && (
        <button
          onClick={() => loadPage(page + 1, false)}
          disabled={loadingMore}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {loadingMore ? <Spinner size="sm" /> : <ChevronDown className="h-4 w-4" />}
          {loadingMore ? 'Loading…' : 'Load more deliveries'}
        </button>
      )}
    </div>
  );
};

export default RiderDeliveriesPage;
