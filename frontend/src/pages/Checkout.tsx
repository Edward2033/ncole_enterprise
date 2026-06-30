import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Plus, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService, addressesService, type NcoleAddress } from '@/services/api';
import { formatPrice } from '@/lib/format';

const PAYMENT_METHODS = [
  { value: 'MTN_MOMO', label: 'MTN Mobile Money', color: 'text-yellow-600' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money', color: 'text-red-600' },
  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', color: 'text-slate-600' },
];

const Checkout: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<NcoleAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New address form
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', street: '', district: '', city: '', province: 'Kigali', country: 'Rwanda' });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/checkout' } }); return; }
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

    // Verify every cart item has a vendorId before proceeding.
    // Items added before this fix (no vendorId in localStorage) are caught here.
    const missingVendor = items.filter(i => !i.vendorId);
    if (missingVendor.length > 0) {
      setError('Some cart items are missing vendor information. Please remove them and add them again.');
      return;
    }

    setPlacing(true);
    setError('');
    try {
      // vendorId is now stored directly on each cart item — no extra API calls needed.
      const orderItems = items.map((item) => ({
        productId:    item.product_id,
        variantId:    item.variant_id ?? null,
        quantity:     item.quantity,
        unitPrice:    item.price,
        productName:  item.name,
        variantTitle: item.variant_title ?? null,
        sku:          item.sku ?? null,
        vendorId:     item.vendorId!,
      }));
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
    } finally {
      setPlacing(false);
    }
  };

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

  const total = subtotal;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <Lock className="h-4 w-4" /> Secure Checkout
      </div>
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
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
              <form onSubmit={handleSaveAddress} className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'fullName', ph: 'Full Name', span: true },
                  { key: 'phone', ph: 'Phone (e.g. +250781234567)', span: true },
                  { key: 'street', ph: 'Street Address', span: true },
                  { key: 'district', ph: 'District' },
                  { key: 'city', ph: 'City' },
                  { key: 'province', ph: 'Province' },
                ].map(f => (
                  <input key={f.key} required placeholder={f.ph}
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

          <button onClick={handlePlaceOrder} disabled={placing || !selectedAddress}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-4 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock className="h-4 w-4" />
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">Your order is protected by our secure platform</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
