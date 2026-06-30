import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/format';
import AuthPromptModal from '@/components/AuthPromptModal';

const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      {/* Auth prompt modal for guest checkout attempt */}
      {showAuthPrompt && (
        <AuthPromptModal
          onLogin={() => {
            setShowAuthPrompt(false);
            navigate('/login', { state: { from: '/checkout' } });
          }}
          onClose={() => setShowAuthPrompt(false)}
        />
      )}

      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </h2>
          <button onClick={() => setIsOpen(false)} aria-label="Close cart" className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-500">Your cart is empty</p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((item) => (
                <div key={item.product_id + (item.variant_id || '')} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl border border-slate-100 object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        {item.variant_title && (
                          <p className="text-xs text-slate-400">{item.variant_title}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.variant_id)}
                        aria-label="Remove item"
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-5">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-emerald-600">Free shipping on all orders</p>
              {/* Checkout — gates on auth, shows modal for guests */}
              <button
                onClick={handleCheckout}
                className="block w-full rounded-full bg-orange-500 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Checkout
              </button>
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="mt-2 block w-full rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
