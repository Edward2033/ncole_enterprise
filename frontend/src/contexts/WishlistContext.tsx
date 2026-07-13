import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wishlistService, type WishlistItem } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_KEY = 'ncole_wishlist_guest';

interface WishlistContextValue {
  items: WishlistItem[];
  productIds: Set<string>;
  totalItems: number;
  loading: boolean;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

// ─── Guest helpers (localStorage) ────────────────────────────────────────────
function readGuest(): string[] {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); }
  catch { return []; }
}
function writeGuest(ids: string[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [guestIds, setGuestIds] = useState<string[]>(readGuest);
  const [loading, setLoading] = useState(false);

  // Load from API when authenticated
  const loadFromApi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wishlistService.get();
      setItems(res.data.items);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Sync guest wishlist to DB after login
  const syncGuestToApi = useCallback(async (guestList: string[]) => {
    if (!guestList.length) return;
    await Promise.all(guestList.map(id => wishlistService.add(id).catch(() => null)));
    writeGuest([]);
    setGuestIds([]);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const guests = readGuest();
      syncGuestToApi(guests).then(() => loadFromApi());
    } else {
      setItems([]);
      setGuestIds(readGuest());
    }
  }, [isAuthenticated, loadFromApi, syncGuestToApi]);

  const productIds = new Set(
    isAuthenticated ? items.map(i => i.productId) : guestIds
  );

  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      setGuestIds(prev => {
        const next = prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId];
        writeGuest(next);
        return next;
      });
      return;
    }
    const already = productIds.has(productId);
    // Optimistic update
    if (already) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      wishlistService.remove(productId).catch(() => loadFromApi());
    } else {
      wishlistService.add(productId)
        .then(res => setItems(res.data.items))
        .catch(() => loadFromApi());
    }
  }, [isAuthenticated, productIds, loadFromApi]);

  const remove = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      setGuestIds(prev => { const n = prev.filter(id => id !== productId); writeGuest(n); return n; });
      return;
    }
    setItems(prev => prev.filter(i => i.productId !== productId));
    await wishlistService.remove(productId).catch(() => loadFromApi());
  }, [isAuthenticated, loadFromApi]);

  const clear = useCallback(async () => {
    if (!isAuthenticated) { writeGuest([]); setGuestIds([]); return; }
    setItems([]);
    await wishlistService.clear().catch(() => loadFromApi());
  }, [isAuthenticated, loadFromApi]);

  return (
    <WishlistContext.Provider value={{
      items, productIds, totalItems: productIds.size,
      loading, toggle, isWishlisted, remove, clear,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
