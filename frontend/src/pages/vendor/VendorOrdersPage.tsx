import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown, X, Package, MapPin, User, CreditCard, FileText, Eye } from 'lucide-react';
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

const PAYMENT_COLOR: Record<string, string> = {
  PAID:     'bg-emerald-100 text-emerald-700',
  PENDING:  'bg-amber-100 text-amber-700',
  FAILED:   'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────

const OrderDetailModal: React.FC<{
  orderId: string;
  onClose: () => void;
  onStatusUpdate: (id: string, status: OrderStatus) => Promise<void>;
  updating: string | null;
}> = ({ orderId, onClose, onStatusUpdate, updating }) => {
  const [order, setOrder] = useState<NcoleVendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    vendorOrdersService.getById(orderId)
      .then(res => setOrder(res.data))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Re-fetch after status update to show updated state
  const handleAction = async (id: string, status: OrderStatus) => {
    await onStatusUpdate(id, status);
    vendorOrdersService.getById(orderId)
      .then(res => setOrder(res.data))
      .catch(() => null);
  };

  const action = order ? VENDOR_ACTIONS[order.status as OrderStatus] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold dark:text-white">
              {order ? order.orderNumber : 'Order Details'}
            </h2>
            {order && <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>}
          </div>
          <div className="flex items-center gap-2">
            {order && (
              <>
                <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
                  {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                </PBadge>
                <PBadge className={PAYMENT_COLOR[order.paymentStatus] ?? 'bg-slate-100 text-slate-600'}>
                  {order.paymentStatus}
                </PBadge>
              </>
            )}
            <button onClick={onClose} className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {order && !loading && (
            <div className="space-y-5">

              {/* Customer */}
              {order.customer && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Name</p>
                      <p className="font-semibold dark:text-white">{order.customer.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Email</p>
                      <p className="font-medium dark:text-white break-all">{order.customer.user.email}</p>
                    </div>
                    {order.customer.user.phone && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                        <p className="font-medium dark:text-white">{order.customer.user.phone}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Delivery Address */}
              {order.address ? (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery Address</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm">
                    <p className="font-semibold dark:text-white">
                      {order.address.fullName}
                      <span className="font-normal text-slate-500"> &middot; {order.address.phone}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{order.address.street}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {order.address.district}, {order.address.city}, {order.address.province}, {order.address.country}
                    </p>
                  </div>
                </section>
              ) : (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery Address</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-400 italic">
                    No delivery address on record
                  </div>
                </section>
              )}

              {/* Order Items */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Products ({order.items.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map(item => {
                    const imgUrl = item.product?.images?.[0];
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                        {/* Product image */}
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-6 w-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm dark:text-white leading-tight">
                            {item.productName}
                            {item.variantTitle && (
                              <span className="font-normal text-slate-500"> — {item.variantTitle}</span>
                            )}
                          </p>
                          {item.product?.category && (
                            <p className="text-xs text-violet-500 mt-0.5">{item.product.category.name}</p>
                          )}
                          {(item.sku ?? item.product?.sku) && (
                            <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku ?? item.product?.sku}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span>Qty: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.quantity}</span></span>
                            <span>Unit: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRWF(item.unitPrice)}</span></span>
                            {item.product && (
                              <span>In stock: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.product.stockQty}</span></span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-bold text-sm dark:text-white">{formatRWF(item.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Payment Summary */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Summary</span>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Method</span>
                    <span className="font-medium dark:text-slate-300">{order.paymentMethod.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium dark:text-slate-300">{formatRWF(order.subtotal)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Fee</span>
                      <span className="font-medium dark:text-slate-300">{formatRWF(order.deliveryFee)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax</span>
                      <span className="font-medium dark:text-slate-300">{formatRWF(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 dark:text-white">
                    <span>Total</span>
                    <span className="text-violet-600">{formatRWF(order.total)}</span>
                  </div>
                </div>
              </section>

              {/* Customer Notes */}
              {order.notes && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer Notes</span>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    {order.notes}
                  </div>
                </section>
              )}

              {/* Action button */}
              {action && (
                <PButton
                  className="w-full"
                  loading={updating === order.id}
                  onClick={() => handleAction(order.id, action.next)}
                >
                  {action.label}
                </PButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<NcoleVendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<OrderStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback((resetList = true) => {
    const targetPage = resetList ? 1 : page + 1;
    if (resetList) { setLoading(true); setPage(1); }
    else setLoadingMore(true);
    vendorOrdersService.list(targetPage, 20)
      .then(res => {
        setOrders(prev => resetList ? res.data : [...prev, ...res.data]);
        setHasMore(res.data.length === 20);
        if (!resetList) setPage(targetPage);
      })
      .catch(() => null)
      .finally(() => { setLoading(false); setLoadingMore(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => { load(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    await vendorOrdersService.updateStatus(id, status).catch(() => null);
    setUpdating(null);
    load(true);
  };

  const visible = orders
    .filter(o => filter === 'ALL' || o.status === filter)
    .filter(o =>
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.user.name ?? '').toLowerCase().includes(search.toLowerCase())
    );

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
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order # or customer…"
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
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
            const thumbs = order.items.slice(0, 3);
            return (
              <PCard key={order.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: thumbnails + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex -space-x-2 flex-shrink-0">
                      {thumbs.map(item => {
                        const img = item.product?.images?.[0];
                        return (
                          <div key={item.id} className="h-11 w-11 overflow-hidden rounded-xl border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800">
                            {img ? (
                              <img src={img} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-slate-300" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {order.items.length > 3 && (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold dark:text-white">{order.orderNumber}</span>
                        <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
                          {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                        </PBadge>
                        <PBadge className={PAYMENT_COLOR[order.paymentStatus] ?? 'bg-slate-100 text-slate-600'}>
                          {order.paymentStatus}
                        </PBadge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {formatDate(order.createdAt)}
                        {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        {order.customer && <span> · {order.customer.user.name}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right: total + buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <span className="text-base font-bold dark:text-white">{formatRWF(order.total)}</span>
                    <button
                      onClick={() => setDetailId(order.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </button>
                    {action && (
                      <PButton
                        size="sm"
                        loading={updating === order.id}
                        onClick={() => handleStatusUpdate(order.id, action.next)}
                      >
                        {action.label}
                      </PButton>
                    )}
                  </div>
                </div>
              </PCard>
            );
          })}

          {hasMore && filter === 'ALL' && !search && (
            <button onClick={() => load(false)} disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition">
              {loadingMore ? <Spinner size="sm" /> : <ChevronDown className="h-4 w-4" />}
              {loadingMore ? 'Loading…' : 'Load more orders'}
            </button>
          )}
        </div>
      )}

      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onStatusUpdate={handleStatusUpdate}
          updating={updating}
        />
      )}
    </div>
  );
};

export default VendorOrdersPage;
