import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  ShieldCheck, Truck, Tag, LogIn,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/format';
import AuthPromptModal from '@/components/AuthPromptModal';

// ── Trust badge ───────────────────────────────────────────────────────────────
const TrustBadge: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
    {icon}
    <span>{text}</span>
  </div>
);

// ── Empty cart ────────────────────────────────────────────────────────────────
const EmptyCart: React.FC = () => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="relative mb-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
      </div>
      <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
        0
      </div>
    </div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
    <p className="mt-2 text-slate-500 dark:text-slate-400">
      Browse our products and add something you love.
    </p>
    <Link to="/shop"
      className="mt-8 flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition-all duration-200 shadow-md shadow-orange-200 dark:shadow-orange-900/30 active:scale-95">
      <ShoppingBag className="h-4 w-4" /> Start Shopping
    </Link>
  </div>
);

// ── Main CartPage ─────────────────────────────────────────────────────────────
// Anyone can view and manage their cart.
// Login is only required when clicking "Proceed to Checkout".
const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Empty cart — same for guests and logged-in users
  if (items.length === 0) return <EmptyCart />;

  const delivery = 0;
  const total    = subtotal + delivery;

  const handleRemove = (productId: string, variantId?: string) => {
    const key = productId + (variantId ?? '');
    setRemovingId(key);
    setTimeout(() => {
      removeFromCart(productId, variantId);
      setRemovingId(null);
    }, 250);
  };

  // Gate checkout: if not authenticated show the prompt modal, else navigate
  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 lg:px-8 lg:py-10">

      {/* Auth prompt modal — shown to guests who click Proceed to Checkout */}
      {showAuthPrompt && (
        <AuthPromptModal
          onLogin={() => {
            setShowAuthPrompt(false);
            navigate('/auth', { state: { from: '/checkout' } });
          }}
          onClose={() => setShowAuthPrompt(false)}
        />
      )}

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-400 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button onClick={() => clearCart()}
          className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors underline underline-offset-4">
          Clear all
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">

        {/* ── Cart items ───────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item, i) => {
            const key        = item.product_id + (item.variant_id ?? '');
            const isRemoving = removingId === key;

            return (
              <div
                key={key}
                className={`group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300
                  dark:border-slate-700 dark:bg-slate-800
                  hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800
                  animate-in fade-in slide-in-from-left-4
                  sm:gap-4 sm:p-4
                  ${isRemoving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
                `}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                {/* Product image */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 sm:h-24 sm:w-24">
                  {item.image ? (
                    <img
                      src={item.image} alt={item.name} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                      {item.variant_title && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{item.variant_title}</p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">SKU: {item.sku}</p>
                      )}
                      <p className="mt-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                        {formatPrice(item.price)} each
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(item.product_id, item.variant_id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantity + line total */}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Continue shopping */}
          <Link to="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-orange-600 transition-colors">
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Order summary ────────────────────────────────────────────────── */}
        <div className="h-fit animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">Order Summary</h2>

            {/* Line items */}
            <div className="space-y-3 text-sm">
              {items.map(item => (
                <div key={item.product_id + (item.variant_id ?? '')} className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-slate-100 dark:border-slate-700" />

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Delivery
                </span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tax
                </span>
                <span className="text-slate-400 text-xs italic">At checkout</span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-between rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
              <span className="font-bold text-slate-900 dark:text-white">Total</span>
              <span className="text-lg font-bold text-orange-600">{formatPrice(total)}</span>
            </div>

            {/* Guest hint — only shown when not logged in */}
            {!isAuthenticated && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <LogIn className="h-3.5 w-3.5" />
                Sign in required to complete purchase
              </p>
            )}

            {/* CTA — works for both guests (triggers modal) and logged-in users */}
            <button
              onClick={handleCheckout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition-all duration-200 shadow-md shadow-orange-200 dark:shadow-orange-900/30 active:scale-[0.98]"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            {/* Trust badges */}
            <div className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
              <TrustBadge icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />} text="Secure checkout" />
              <TrustBadge icon={<Truck className="h-3.5 w-3.5 text-blue-500" />}       text="Free delivery on all orders" />
              <TrustBadge icon={<Tag className="h-3.5 w-3.5 text-orange-500" />}        text="Best price guaranteed" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
