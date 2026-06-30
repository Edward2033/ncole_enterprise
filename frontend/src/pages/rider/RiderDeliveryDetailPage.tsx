import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Package, CheckCircle } from 'lucide-react';
import { deliveriesService, type NcoleDelivery } from '@/services/api';
import { PCard, PBadge, PButton, Spinner } from '@/components/ui/portal-ui';
import { formatRWF, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/utils';

const RIDER_TRANSITIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  READY_FOR_PICKUP: { next: 'OUT_FOR_DELIVERY', label: 'Mark Picked Up' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark Delivered' },
};

const RiderDeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<NcoleDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // R1: fetch up to 100 assigned orders so the detail page works even when
    // the order is not on the first page of the default paginated response.
    deliveriesService.getAssigned(1, 100)
      .then(res => setOrder(res.data.find(o => o.id === id) ?? null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  const handleTransition = async (next: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await deliveriesService.updateStatus(order.id, next);
      setOrder(prev => prev ? { ...prev, status: next } : prev);
    } catch { /* ignore */ }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  if (!order) return (
    <div className="flex flex-col items-center pt-16 gap-3 text-center">
      <p className="text-sm text-slate-500">Delivery not found.</p>
      <Link to="/rider/deliveries" className="text-sm font-semibold text-orange-600 hover:underline">Back to deliveries</Link>
    </div>
  );

  const transition = RIDER_TRANSITIONS[order.status as OrderStatus];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/rider/deliveries" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold dark:text-white">{order.orderNumber}</h1>
          <PBadge className={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
            {ORDER_STATUS_LABEL[order.status as OrderStatus]}
          </PBadge>
        </div>
      </div>

      {order.address && (
        <PCard>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold dark:text-white">{order.address.fullName}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{order.address.street}, {order.address.district}</p>
              <p className="text-sm text-slate-500">{order.address.city}</p>
            </div>
          </div>
          <a href={`tel:${order.address.phone}`}
            className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
            <Phone className="h-4 w-4" /> {order.address.phone}
          </a>
        </PCard>
      )}

      <PCard>
        <h2 className="mb-3 font-semibold dark:text-white flex items-center gap-2">
          <Package className="h-4 w-4" /> Items ({order.items.length})
        </h2>
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between py-2 border-b last:border-0 dark:border-slate-700 text-sm">
            <span className="text-slate-700 dark:text-slate-300">{item.productName} × {item.quantity}</span>
            <span className="font-medium dark:text-white">{formatRWF(item.total)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between font-bold text-sm border-t pt-3 dark:border-slate-700">
          <span className="dark:text-white">Delivery Fee</span>
          <span className="text-orange-600">{formatRWF(order.deliveryFee)}</span>
        </div>
      </PCard>

      <PCard>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Payment</span>
          <span className="font-semibold dark:text-white">{order.paymentMethod.replace(/_/g, ' ')}</span>
        </div>
        {order.notes && (
          <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Note: </span>{order.notes}
          </div>
        )}
      </PCard>

      {transition && (
        <PButton className="w-full" size="lg" loading={updating}
          onClick={() => handleTransition(transition.next)}>
          <CheckCircle className="h-5 w-5" /> {transition.label}
        </PButton>
      )}

      {order.status === 'DELIVERED' && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 dark:bg-green-900/20 py-4 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">Delivery Completed!</span>
        </div>
      )}
    </div>
  );
};

export default RiderDeliveryDetailPage;
