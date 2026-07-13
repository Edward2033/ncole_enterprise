import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, CheckCircle, ArrowRight, Package,
  MapPin, CreditCard, Bell, TrendingUp, Star, Sparkles,
  ShoppingCart, Trash2, Plus, Minus, ArrowUpRight, Gift,
  Truck, Shield, Heart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ordersService, type NcoleOrder } from '@/services/api';
import { formatRWF, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, type OrderStatus } from '@/lib/utils';
import { formatPrice } from '@/lib/format';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: number | string;
  gradient: string; delay?: string;
}> = ({ icon, label, value, gradient, delay = '0ms' }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${gradient}`}
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none">{value}</p>
      </div>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
    </div>
    <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
  </div>
);

// ─── Quick action ─────────────────────────────────────────────────────────────
const QuickAction: React.FC<{
  to: string; icon: React.ReactNode; label: string; desc: string; color: string; delay?: string;
}> = ({ to, icon, label, desc, color, delay = '0ms' }) => (
  <Link
    to={to}
    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-700"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
    <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-500" />
  </Link>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 animate-pulse">
    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const POLL_MS = 30_000;

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, addToCart, subtotal } = useCart();
  const { items: wishlistItems, remove: removeWishlist, totalItems: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback((silent = false) => {
    if (!silent) setLoading(true);
    ordersService.myOrders(1, 20)
      .then(res => { setOrders(res.data); setError(null); })
      .catch(e => { if (!silent) setError((e as Error).message || 'Failed to load orders.'); })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const total      = orders.length;
  const pending    = orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length;
  const completed  = orders.filter(o => o.status === 'DELIVERED').length;
  const recent     = orders.slice(0, 6);
  const cartTotal  = subtotal;
  const recentWishlist = wishlistItems.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(false); }}
            className="ml-4 rounded-lg bg-red-100 dark:bg-red-800 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition">
            Retry
          </button>
        </div>
      )}

      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">
              <Sparkles className="h-3.5 w-3.5" /> My Account
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-orange-100">
              {pending > 0
                ? <><span className="font-bold text-white">{pending}</span> active order{pending !== 1 ? 's' : ''} in progress.</>
                : items.length > 0
                ? <><span className="font-bold text-white">{items.length}</span> item{items.length !== 1 ? 's' : ''} waiting in your cart.</>
                : 'Welcome back! Ready to shop?'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/shop"
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition backdrop-blur-sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Shop Now
            </Link>
            {items.length > 0 && (
              <Link to="/cart"
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition">
                <ShoppingCart className="h-3.5 w-3.5" /> Cart ({items.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard icon={<ShoppingBag className="h-5 w-5 text-white" />}  label="Total Orders"  value={loading ? '—' : total}     gradient="bg-gradient-to-br from-blue-500 to-blue-600"      delay="0ms" />
        <KpiCard icon={<Clock className="h-5 w-5 text-white" />}        label="Active Orders" value={loading ? '—' : pending}   gradient="bg-gradient-to-br from-amber-500 to-amber-600"    delay="60ms" />
        <KpiCard icon={<CheckCircle className="h-5 w-5 text-white" />}  label="Delivered"     value={loading ? '—' : completed} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" delay="120ms" />
        <KpiCard icon={<Heart className="h-5 w-5 text-white" />}        label="Wishlist"      value={wishlistCount}             gradient="bg-gradient-to-br from-rose-500 to-rose-600"      delay="180ms" />
      </div>

      {/* ── Wishlist preview ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Wishlist
            {wishlistCount > 0 && (
              <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 text-xs font-bold text-rose-600">{wishlistCount}</span>
            )}
          </h2>
          {wishlistCount > 0 && (
            <Link to="/wishlist" className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {recentWishlist.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center px-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 mb-3">
              <Heart className="h-7 w-7 text-rose-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No saved items</p>
            <p className="mt-1 text-xs text-slate-400">Save products you love for later</p>
            <Link to="/shop" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition">
              <ShoppingBag className="h-3.5 w-3.5" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {recentWishlist.map(item => {
              const p = item.product;
              return (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 transition hover:shadow-md">
                  <button onClick={() => removeWishlist(item.productId)}
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500 transition"
                    aria-label="Remove">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <Link to={`/products/${p.slug}`} className="block aspect-square overflow-hidden bg-white dark:bg-slate-800">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center text-slate-300 text-xs">No image</div>}
                  </Link>
                  <div className="p-2">
                    <Link to={`/products/${p.slug}`}>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white line-clamp-1 hover:text-orange-600 transition">{p.name}</p>
                    </Link>
                    <p className="text-xs font-bold text-orange-600 mt-0.5">{formatPrice(p.basePrice)}</p>
                    <button
                      onClick={() => { addToCart({ product_id: item.productId, name: p.name, price: p.basePrice, image: p.images?.[0], vendorId: undefined }, 1); removeWishlist(item.productId); }}
                      disabled={p.stockQty === 0}
                      className="mt-1.5 w-full rounded-lg bg-orange-500 py-1.5 text-[10px] font-semibold text-white hover:bg-orange-600 disabled:opacity-40 transition">
                      {p.stockQty === 0 ? 'Out of Stock' : 'Move to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cart summary + Quick actions ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Cart summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" /> Shopping Cart
              {items.length > 0 && (
                <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-bold text-orange-600">
                  {items.length}
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <Link to="/cart" className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline">
                View cart <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center px-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-3">
                <ShoppingCart className="h-7 w-7 text-orange-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your cart is empty</p>
              <p className="mt-1 text-xs text-slate-400">Discover amazing products from our vendors</p>
              <Link to="/shop"
                className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition">
                <ShoppingBag className="h-3.5 w-3.5" /> Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.product_id + (item.variant_id ?? '')} className="flex items-center gap-3 px-5 py-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                      {item.variant_title && (
                        <p className="text-xs text-slate-400">{item.variant_title}</p>
                      )}
                      <p className="text-xs font-bold text-orange-600">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.variant_id)}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Subtotal ({items.length} items)</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex gap-2">
                  <Link to="/cart" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    View Cart
                  </Link>
                  <Link to="/checkout" className="flex-1 rounded-xl bg-orange-500 py-2.5 text-center text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm shadow-orange-200">
                    Checkout →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Quick Actions</h2>
          <QuickAction to="/account/orders"        icon={<Package className="h-5 w-5 text-violet-600" />}   label="My Orders"     desc="Track and manage your orders"                                    color="bg-violet-100 dark:bg-violet-900/30"  delay="0ms" />
          <QuickAction to="/wishlist"               icon={<Heart className="h-5 w-5 text-rose-600" />}       label="Wishlist"      desc={`${wishlistCount} saved item${wishlistCount !== 1 ? 's' : ''}`} color="bg-rose-100 dark:bg-rose-900/30"      delay="50ms" />
          <QuickAction to="/account/addresses"      icon={<MapPin className="h-5 w-5 text-pink-600" />}      label="Addresses"     desc="Manage delivery addresses"                                       color="bg-pink-100 dark:bg-pink-900/30"      delay="100ms" />
          <QuickAction to="/account/billing"        icon={<CreditCard className="h-5 w-5 text-blue-600" />}  label="Billing"       desc="View invoices and payments"                                      color="bg-blue-100 dark:bg-blue-900/30"      delay="150ms" />
          <QuickAction to="/account/notifications"  icon={<Bell className="h-5 w-5 text-orange-600" />}      label="Notifications" desc="Manage notification preferences"                                  color="bg-orange-100 dark:bg-orange-900/30"  delay="200ms" />
        </div>
      </div>

      {/* ── Trust badges ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Truck className="h-5 w-5 text-emerald-600" />,  label: 'Free Delivery',    sub: 'On all orders',          bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
          { icon: <Shield className="h-5 w-5 text-blue-600" />,    label: 'Secure Payments',  sub: 'MTN MoMo & Airtel',      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { icon: <Gift className="h-5 w-5 text-violet-600" />,    label: 'Easy Returns',     sub: 'Within 7 days',          bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
        ].map(b => (
          <div key={b.label} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center ${b.bg}`}>
            {b.icon}
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{b.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent orders ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" /> Recent Orders
          </h2>
          {!loading && orders.length > 0 && (
            <Link to="/account/orders" className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="px-5 divide-y divide-slate-50 dark:divide-slate-700/50">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 mb-3">
              <Package className="h-8 w-8 text-orange-300" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">No orders yet</p>
            <p className="mt-1 text-sm text-slate-400">Discover amazing products from our vendors</p>
            <Link to="/shop"
              className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition shadow-sm shadow-orange-200">
              <Star className="h-4 w-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recent.map((order, i) => (
              <Link key={order.id} to={`/order/${order.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                  {(order.items[0]?.product?.images?.[0] ?? order.items[0]?.imageUrl) ? (
                    <img
                      src={order.items[0].product?.images?.[0] ?? order.items[0].imageUrl}
                      alt={order.items[0].productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {order.items.slice(0, 2).map(it => it.productName).join(', ')}
                    {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 pl-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRWF(order.total)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ORDER_STATUS_COLOR[order.status as OrderStatus]}`}>
                    {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
