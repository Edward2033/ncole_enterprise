import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { vendorOrdersService, type NcoleVendorOrder } from '@/services/api';
import { PCard, PBadge, PButton, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, formatDate, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

type OrderStatusFilter = OrderStatus | 'ALL';

const VENDOR_ACTIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING:    { next: 'CONFIRMED',        label: 'Confirm Order'    },
  CONFIRMED:  { next: 'PROCESSING',       label: 'Start Processing' },
  PROCESSING: { next: 'READY_FOR_PICKUP', label: 'Mark Ready'       },
};

const FILTERS: OrderStatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'];

const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleVendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    vendorOrdersService.list()
      .then(res => setOrders(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    await vendorOrdersService.updateStatus(id, status).catch(() => null);
    setUpdating(null);
    load();
  };

  const visible = orders
    .filter(o => filter === 'ALL' || o.status === filter)
    .filter(o => !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()));

  const counts = FILTERS.reduce<Partial<Record<OrderStatusFilter, number>>>((acc, f) => {
    acc[f] = f === 'ALL' ? orders.length : orders.filter(o => o.status === f).length;
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">{orders.length} total orders</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order #…"
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === f ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
            {f === 'ALL' ? 'All' : ORDER_STATUS_LABEL[f as OrderStatus]}
            {(counts[f] ?? 0) > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <PCard className="py-16 text-center text-slate-500">No orders found.</PCard>
      ) : (
        <div className="space-y-3">
          {visible.map(order => {
            const action = VENDOR_ACTIONS[order.status as OrderStatus];
            const isExpanded = expanded === order.id;
            return (
              <PCard key={order.id} className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{order.orderNumber}</span>
                      <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
                        {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                      </PBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(order.createdAt)} · {order.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold dark:text-white">{formatRWF(order.total)}</span>
                    {action && (
                      <PButton size="sm" loading={updating === order.id}
                        onClick={e => { e.stopPropagation(); handleStatusUpdate(order.id, action.next); }}>
                        {action.label}
                      </PButton>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 dark:border-slate-700 space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">{item.productName} × {item.quantity}</span>
                        <span className="font-medium dark:text-white">{formatRWF(item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t pt-2 dark:border-slate-700">
                      <span className="dark:text-white">Total</span>
                      <span className="text-violet-600">{formatRWF(order.total)}</span>
                    </div>
                  </div>
                )}
              </PCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorOrdersPage;
