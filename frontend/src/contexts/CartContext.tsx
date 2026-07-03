import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartItem } from '@/lib/types';

const STORAGE_KEY = 'ecom_cart';

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: CartItem, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((item: CartItem, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product_id === item.product_id && i.variant_id === item.variant_id,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { ...item, quantity }];
    });
    // Do NOT open the cart drawer automatically — user must click the cart icon
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === productId && i.variant_id === variantId)),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === productId && i.variant_id === variantId
            ? { ...i, quantity: Math.max(1, quantity) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
