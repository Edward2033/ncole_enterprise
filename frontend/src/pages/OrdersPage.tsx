import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, RefreshCw } from 'lucide-react';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatRWF } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-amber-100 text-amber-700',
  CONFIRMED:        'bg-blue-100 text-blue-700',
  PROCESSING:       'bg-violet-100 text-violet-700',
  READY_FOR_PICKUP: 'bg-cyan-100 text-cyan-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED:        'bg-emerald-100 text-emerald-700',
  CANCELLED:        'bg-red-100 text-red-700',
  REFUNDED:         'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:          'Pending',
  CONFIRMED:        'Confirmed',
  PROCESSING:       'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
  CANCELLED:        'Cancelled',
  REFUNDED:         'Refunded',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    ordersService.myOrders()
      .then(res => setOrders(res.data))
      .catch(() => null)
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(false); }, [load]);

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-4 lg:px-8">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-40">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Package className="h-12 w-12 text-slate-200" />
          <h2 className="mt-4 font-semibold text-slate-900">No orders yet</h2>
          <p className="mt-1 text-sm text-slate-400">Start shopping to see your orders here</p>
          <Link to="/shop" className="mt-6 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm">
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[order.status] ?? order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-base font-bold text-slate-900">{formatRWF(order.total)}</span>
                </div>
              </div>
              {/* Product thumbnails + names */}
              {order.items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.items.slice(0, 4).map(item => {
                    const imgUrl = item.product?.images?.[0] ?? item.imageUrl;
                    return (
                      <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-slate-200">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-700 max-w-[120px] truncate">
                          {item.productName}{item.variantTitle ? ` (${item.variantTitle})` : ''}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">x{item.quantity}</span>
                      </div>
                    );
                  })}
                  {order.items.length > 4 && (
                    <div className="flex items-center rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                      <span className="text-xs text-slate-400">+{order.items.length - 4} more</span>
                    </div>
                  )}
                </div>
              )}
              {/* Footer row */}
              <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                <Link to={`/order/${order.id}`} className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:gap-2 transition-all">
                  View details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
