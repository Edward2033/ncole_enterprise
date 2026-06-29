import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-slate-200" />
        <h1 className="mt-6 font-serif text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Browse our products and add something you love.</p>
        <Link
          to="/"
          className="mt-6 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 font-serif text-3xl font-bold text-slate-900">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.product_id + (item.variant_id || '')}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-24 flex-shrink-0 rounded-xl border border-slate-100 object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    {item.variant_title && <p className="text-sm text-slate-400">{item.variant_title}</p>}
                    {item.options && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {Object.values(item.options).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id, item.variant_id)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span className="text-slate-400">Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
