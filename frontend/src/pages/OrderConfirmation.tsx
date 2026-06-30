import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatPrice } from '@/lib/format';

const OrderConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<NcoleOrder | null>(null);

  useEffect(() => {
    if (!id) return;
    ordersService.getById(id)
      .then(res => setOrder(res.data))
      .catch(() => null);
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:px-8">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">Order Placed!</h1>
      <p className="mt-3 text-slate-500">
        Thank you for your order. You'll receive a confirmation and payment instructions shortly.
      </p>
      {order && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5">
          <span className="text-sm font-semibold text-orange-700">{order.orderNumber}</span>
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-left">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
            <Package className="h-5 w-5 text-orange-500" /> Order Summary
          </h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.productName}{item.variantTitle ? ` (${item.variantTitle})` : ''} × {item.quantity}
                </span>
                <span className="font-semibold">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="text-emerald-600">Free</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
              <span>Total</span><span className="text-orange-600">{formatPrice(order.total)}</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Payment pending:</strong> Please submit your payment via {order.paymentMethod.replace('_', ' ')} to complete this order.
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/shop" className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/" className="flex items-center justify-center rounded-full border border-slate-200 px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
