import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, RefreshCw, Eye, Package } from 'lucide-react';
import { adminOrdersApi, adminRidersApi, type AdminOrder, type AdminRider, type ApiMeta } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminModal } from '@/components/admin/AdminModal';
import { orderStatusBadge } from '@/components/admin/AdminBadge';
import { fmtRWF, fmtDate } from '@/lib/adminFormat';

const STATUSES = ['ALL','PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED'] as const;
const NEXT: Partial<Record<string,string>> = { PENDING:'CONFIRMED',CONFIRMED:'PROCESSING',PROCESSING:'READY_FOR_PICKUP',READY_FOR_PICKUP:'OUT_FOR_DELIVERY',OUT_FOR_DELIVERY:'DELIVERED' };
const STATUS_LABEL: Record<string,string> = { PENDING:'Pending',CONFIRMED:'Confirmed',PROCESSING:'Processing',READY_FOR_PICKUP:'Ready for Pickup',OUT_FOR_DELIVERY:'Out for Delivery',DELIVERED:'Delivered',CANCELLED:'Cancelled',REFUNDED:'Refunded' };

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [riderSel, setRiderSel] = useState<Record<string,string>>({});
  const [assigning, setAssigning] = useState<string|null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true); setError(null);
    try {
      const res = await adminOrdersApi.list(p, 20);
      setOrders(res.data);
      setMeta(res.meta);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(page); }, [page]);
  useEffect(() => { adminRidersApi.list().then(r => setRiders(r.data)).catch(() => null); }, []);

  const handleAdvance = async (o: AdminOrder) => {
    const next = NEXT[o.status];
    if (!next) return;
    try { await adminOrdersApi.updateStatus(o.id, next); await load(page); }
    catch (e) { setError((e as Error).message); }
  };

  const handleCancel = async (o: AdminOrder) => {
    try { await adminOrdersApi.updateStatus(o.id, 'CANCELLED'); await load(page); }
    catch (e) { setError((e as Error).message); }
  };

  const handleAssign = async (orderId: string) => {
    const riderId = riderSel[orderId];
    if (!riderId) return;
    setAssigning(orderId);
    try { await adminOrdersApi.assignRider(orderId, riderId); await load(page); }
    catch (e) { setError((e as Error).message); }
    finally { setAssigning(null); }
  };

  const filtered = orders.filter(o => {
    const matchS = statusFilter === 'ALL' || o.status === statusFilter;
    const matchQ = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || (o.customer?.user.name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  const columns: Column<AdminOrder>[] = [
    {
      key: 'order', header: 'Order',
      render: o => (
        <div>
          <button onClick={() => setDetail(o)} className="font-medium text-orange-600 hover:underline">{o.orderNumber}</button>
          <p className="text-xs text-slate-500">{fmtDate(o.createdAt)}</p>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: o => <div><p className="text-sm dark:text-white">{o.customer?.user.name ?? '—'}</p><p className="text-xs text-slate-500">{o.customer?.user.email ?? ''}</p></div> },
    { key: 'items', header: 'Items', render: o => (
      <div className="space-y-1">
        {o.items.slice(0, 3).map(it => {
          const imgUrl = it.product?.images?.[0];
          return (
            <div key={it.id} className="flex items-center gap-1.5">
              <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                {imgUrl ? (
                  <img src={imgUrl} alt={it.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {it.productName}{it.variantTitle ? ` (${it.variantTitle})` : ''}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0">x{it.quantity}</span>
            </div>
          );
        })}
        {o.items.length > 3 && (
          <p className="text-[10px] text-slate-400">+{o.items.length - 3} more</p>
        )}
      </div>
    )},
    { key: 'total', header: 'Total', render: o => <span className="font-semibold dark:text-white">{fmtRWF(o.total)}</span> },
    { key: 'status', header: 'Status', render: o => orderStatusBadge(o.status) },
    { key: 'payment', header: 'Payment', render: o => (
      <div className="space-y-1">
        <span className="text-xs text-slate-600 dark:text-slate-300">{o.paymentMethod.replace(/_/g,' ')}</span>
        <span className={`block rounded-full px-2 py-0.5 text-[10px] font-semibold w-fit ${
          o.paymentStatus === 'PAID'    ? 'bg-emerald-100 text-emerald-700' :
          o.paymentStatus === 'FAILED'  ? 'bg-red-100 text-red-700' :
          o.paymentStatus === 'REFUNDED' ? 'bg-slate-100 text-slate-600' :
          'bg-amber-100 text-amber-700'
        }`}>{o.paymentStatus}</span>
      </div>
    )},
    {
      key: 'actions', header: 'Actions',
      render: o => (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setDetail(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"><Eye className="h-4 w-4"/></button>
          {NEXT[o.status] && (
            <button onClick={() => handleAdvance(o)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              {'->'} {STATUS_LABEL[NEXT[o.status]!]}
            </button>
          )}
          {!['CANCELLED','DELIVERED','REFUNDED'].includes(o.status) && (
            <button onClick={() => handleCancel(o)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">Cancel</button>
          )}
          {['CONFIRMED','PROCESSING','READY_FOR_PICKUP'].includes(o.status) && (
            <div className="flex gap-1 w-full mt-1">
              <select value={riderSel[o.id] ?? ''} onChange={e => setRiderSel(p => ({...p,[o.id]:e.target.value}))}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white min-w-0">
                <option value="">Assign rider...</option>
                {riders.map(r => <option key={r.id} value={r.id}>{r.user.name}</option>)}
              </select>
              <button onClick={() => handleAssign(o.id)} disabled={!riderSel[o.id] || assigning === o.id}
                className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-40 transition">
                {assigning === o.id ? '...' : 'Go'}
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100"><ShoppingBag className="h-5 w-5 text-cyan-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
            <p className="text-sm text-slate-500">{meta?.total ?? '—'} total orders</p>
          </div>
        </div>
        <button onClick={() => load(page)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <AdminSearch value={search} onChange={setSearch} placeholder="Order # or customer..." className="flex-1 min-w-[200px] max-w-xs"/>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === s ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <AdminTable<AdminOrder>
        columns={columns} data={filtered} keyFn={o => o.id}
        loading={loading} emptyText="No orders found" emptyIcon={<ShoppingBag/>}
        page={page} totalPages={meta?.totalPages} total={meta?.total} onPage={p => setPage(p)}
      />

      {/* Order detail modal */}
      <AdminModal open={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.orderNumber}`} size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Customer', detail.customer?.user.name ?? '—'],
                ['Email', detail.customer?.user.email ?? '—'],
                ['Status', STATUS_LABEL[detail.status]],
                ['Payment', detail.paymentMethod.replace(/_/g,' ')],
                ['Subtotal', fmtRWF(detail.subtotal)],
                ['Delivery', fmtRWF(detail.deliveryFee)],
                ['Total', fmtRWF(detail.total)],
                ['Date', fmtDate(detail.createdAt)],
              ].map(([l,v]) => (
                <div key={l} className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-medium dark:text-white">{v}</p>
                </div>
              ))}
            </div>
            {detail.address && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                <p className="text-xs text-slate-400 mb-1">Delivery Address</p>
                <p className="dark:text-white">{detail.address.fullName} &middot; {detail.address.phone}</p>
                <p className="text-slate-500">{detail.address.street}, {detail.address.district}, {detail.address.city}</p>
              </div>
            )}
            <div>
              <p className="font-semibold dark:text-white mb-2">Items ({detail.items.length})</p>
              <div className="space-y-2">
                {detail.items.map(it => {
                  const imgUrl = it.product?.images?.[0];
                  return (
                    <div key={it.id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {imgUrl ? (
                          <img src={imgUrl} alt={it.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white truncate">
                          {it.productName}{it.variantTitle ? ` — ${it.variantTitle}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">Qty: {it.quantity} &times; {fmtRWF(it.unitPrice)}</p>
                      </div>
                      <span className="font-semibold dark:text-white flex-shrink-0">{fmtRWF(it.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminOrdersPage;
