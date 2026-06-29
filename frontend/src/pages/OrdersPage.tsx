import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatPrice } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-violet-100 text-violet-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersService.myOrders()
      .then(res => setOrders(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-4 lg:px-8">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">My Orders</h1>
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-base font-bold text-slate-900">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
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
