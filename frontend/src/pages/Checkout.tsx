import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Plus, MapPin, CreditCard, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService, productsService, addressesService, type NcoleAddress } from '@/services/api';
import { formatPrice } from '@/lib/format';

const PAYMENT_METHODS = [
  { value: 'MTN_MOMO',         label: 'MTN Mobile Money',  icon: '✦', color: 'text-yellow-600', hint: 'You will receive a payment prompt on your MTN line.' },
  { value: 'AIRTEL_MONEY',     label: 'Airtel Money',      icon: '⬡', color: 'text-red-600',    hint: 'You will receive a payment prompt on your Airtel line.' },
  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery',  icon: '₣', color: 'text-slate-600',  hint: 'Pay in cash when your order arrives.' },
];

// ─── Payment Confirmation Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
  items: Array<{ name: string; variant_title?: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  paymentMethod: string;
  address: NcoleAddress | undefined;
  placing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  items, subtotal, paymentMethod, address, placing, onConfirm, onCancel,
}) => {
  const pm = PAYMENT_METHODS.find(m => m.value === paymentMethod);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Review &amp; Confirm Order</h2>
          <button onClick={onCancel} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 px-5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              {item.image && <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                {item.variant_title && <p className="text-xs text-slate-400">{item.variant_title}</p>}
                <p className="text-xs text-slate-400">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 px-5 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="text-emerald-600 font-medium">Free</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
            <span>Total</span><span className="text-orange-600">{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Payment + Address */}
        <div className="border-t border-slate-100 px-5 py-3 space-y-2">
          {pm && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">{pm.label}</p>
                <p className="text-xs text-amber-600">{pm.hint}</p>
              </div>
            </div>
          )}
          {address && (
            <p className="text-xs text-slate-500">
              Delivering to: <span className="font-medium text-slate-700">{address.fullName}, {address.street}, {address.district}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 px-5 py-4 flex gap-3">
          <button onClick={onCancel} disabled={placing}
            className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50">
            Back
          </button>
          <button onClick={onConfirm} disabled={placing}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition shadow-md shadow-orange-500/20 disabled:opacity-50">
            <Lock className="h-3.5 w-3.5" />
            {placing ? 'Placing…' : 'Confirm &amp; Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      navigate('/auth', { state: { from: '/checkout' }, replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [addresses, setAddresses] = useState<NcoleAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', street: '', district: '', city: '', province: 'Kigali', country: 'Rwanda' });

  useEffect(() => {
    addressesService.list()
      .then(res => {
        setAddresses(res.data);
        const def = res.data.find(a => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (res.data.length > 0) setSelectedAddress(res.data[0].id);
        else setShowAddAddress(true);
      })
      .catch(() => setShowAddAddress(true));
  }, [isAuthenticated, navigate]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await addressesService.create({ ...addrForm, isDefault: addresses.length === 0 });
      setAddresses(prev => [...prev, res.data]);
      setSelectedAddress(res.data.id);
      setShowAddAddress(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { setError('Please select a delivery address.'); return; }
    if (items.length === 0) { setError('Your cart is empty.'); return; }
    setPlacing(true);
    setError('');
    try {
      const orderItems = await Promise.all(
        items.map(async (item) => {
          let vendorId = item.vendorId;
          if (!vendorId) {
            const product = await productsService.get(item.product_id).then(r => r.data);
            vendorId = product.vendorId;
          }
          return {
            productId:    item.product_id,
            variantId:    item.variant_id ?? null,
            quantity:     item.quantity,
            unitPrice:    item.price,
            productName:  item.name,
            variantTitle: item.variant_title ?? null,
            sku:          item.sku ?? null,
            vendorId,
          };
        })
      );
      const res = await ordersService.place({
        addressId: selectedAddress,
        paymentMethod,
        notes: notes || undefined,
        items: orderItems,
      });
      clearCart();
      navigate(`/order-confirmation/${res.data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setShowConfirm(false);
    } finally {
      setPlacing(false);
    }
  };

  const handleReviewOrder = () => {
    if (!selectedAddress) { setError('Please select a delivery address.'); return; }
    if (items.length === 0) { setError('Your cart is empty.'); return; }
    setError('');
    setShowConfirm(true);
  };

  const total = subtotal;
  const selectedAddr = addresses.find(a => a.id === selectedAddress);

  if (items.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <button onClick={() => navigate('/shop')} className="mt-6 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 lg:py-10 lg:px-8">
      {/* Payment confirmation dialog */}
      {showConfirm && (
        <ConfirmDialog
          items={items}
          subtotal={subtotal}
          paymentMethod={paymentMethod}
          address={selectedAddr}
          placing={placing}
          onConfirm={handlePlaceOrder}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <Lock className="h-4 w-4" /> Secure Checkout
      </div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 lg:text-3xl lg:mb-8">Checkout</h1>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Delivery Address */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <MapPin className="h-5 w-5 text-orange-500" /> Delivery Address
              </h2>
              <button onClick={() => setShowAddAddress(!showAddAddress)}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-400 hover:text-orange-600 transition">
                <Plus className="h-3.5 w-3.5" /> Add New
              </button>
            </div>

            {addresses.length > 0 && !showAddAddress && (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map(addr => (
                  <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                    className={`rounded-xl border p-4 text-left text-sm transition ${selectedAddress === addr.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="font-semibold text-slate-900">{addr.fullName}</p>
                    <p className="mt-1 text-slate-500">{addr.street}, {addr.district}</p>
                    <p className="text-slate-500">{addr.city}, {addr.province}</p>
                    <p className="text-slate-500">{addr.phone}</p>
                    {addr.isDefault && <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Default</span>}
                  </button>
                ))}
              </div>
            )}

            {showAddAddress && (
              <form onSubmit={handleSaveAddress} className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                {[
                  { key: 'fullName',  ph: 'Full Name',                    span: true,  ac: 'name' },
                  { key: 'phone',     ph: 'Phone (e.g. +250781234567)',   span: true,  ac: 'tel' },
                  { key: 'street',    ph: 'Street Address',               span: true,  ac: 'street-address' },
                  { key: 'district',  ph: 'District',                     span: false, ac: 'address-level2' },
                  { key: 'city',      ph: 'City',                         span: false, ac: 'address-level1' },
                  { key: 'province',  ph: 'Province',                     span: false, ac: 'address-level1' },
                ].map(f => (
                  <input key={f.key} required placeholder={f.ph}
                    autoComplete={f.ac}
                    value={(addrForm as Record<string, string>)[f.key]}
                    onChange={e => setAddrForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className={`rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 ${f.span ? 'sm:col-span-2' : ''}`}
                  />
                ))}
                <button type="submit" className="sm:col-span-2 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                  Save Address
                </button>
              </form>
            )}
          </section>

          {/* Payment Method */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
              <CreditCard className="h-5 w-5 text-orange-500" /> Payment Method
            </h2>
            <div className="grid gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${paymentMethod === pm.value ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-sm ${pm.color}`}>
                    {pm.value === 'MTN_MOMO' ? '✦' : pm.value === 'AIRTEL_MONEY' ? '⬡' : '₣'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{pm.label}</p>
                    {pm.value !== 'CASH_ON_DELIVERY' && <p className="text-xs text-slate-400">You'll receive a payment reference after ordering</p>}
                  </div>
                  {paymentMethod === pm.value && <CheckCircle2 className="ml-auto h-5 w-5 text-orange-500" />}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-base font-bold text-slate-900">Order Notes (optional)</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Any special instructions for delivery..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400" />
          </section>
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Order Summary</h2>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {items.map(item => (
              <div key={item.product_id + (item.variant_id ?? '')} className="flex gap-3">
                {item.image && <img src={item.image} alt={item.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  {item.variant_title && <p className="text-xs text-slate-400">{item.variant_title}</p>}
                  <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="text-emerald-600 font-medium">Free</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-slate-400">Included</span></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-900">
            <span>Total</span><span className="text-orange-600">{formatPrice(total)}</span>
          </div>

          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button onClick={handleReviewOrder} disabled={placing || !selectedAddress}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-4 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock className="h-4 w-4" />
            Review &amp; Place Order
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">Your order is protected by our secure platform</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
