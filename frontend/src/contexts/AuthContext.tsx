import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, saveTokens, clearTokens, getTokens, type NcoleUser } from '@/services/api';

// Guest cart merge — reads localStorage cart and merges into backend after login
const GUEST_CART_KEY = 'ecom_cart';

async function mergeGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return;
    const items: Array<{ product_id: string; variant_id?: string; quantity: number }> = JSON.parse(raw);
    if (!items.length) return;
    const { apiFetch } = await import('@/services/api');
    await Promise.allSettled(
      items
        .filter(item => item.product_id && item.quantity > 0)
        .map(item =>
          apiFetch('/cart/items', {
            method: 'POST',
            body: JSON.stringify({
              productId: item.product_id,
              variantId: item.variant_id ?? null,
              quantity:  item.quantity,
            }),
          })
        )
    );
    localStorage.removeItem(GUEST_CART_KEY);
  } catch { /* never block login on merge failure */ }
}

interface AuthContextValue {
  user: NcoleUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string; requiresOtp?: boolean; userId?: string }>;
  signInOtp: (userId: string, code: string) => Promise<{ error: string | null; role?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<NcoleUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from stored tokens on mount
  useEffect(() => {
    const { accessToken, refreshToken } = getTokens();

    // No tokens at all — skip the network call entirely.
    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // apiFetch inside authService.me() already handles 401 → refresh → retry
        const res = await authService.me();
        if (!cancelled) setUser(res.data);
      } catch {
        // Refresh token also expired or missing — clear and show login
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Force sign-out when apiFetch detects an unrecoverable session expiry
  useEffect(() => {
    const handler = () => {
      clearTokens();
      setUser(null);
    };
    window.addEventListener('ncole:session-expired', handler);
    return () => window.removeEventListener('ncole:session-expired', handler);
  }, []);


  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      const data = res.data as any;
      if (data?.requiresOtp) {
        return { error: null, requiresOtp: true, userId: data.userId };
      }
      saveTokens(data.accessToken, data.refreshToken);
      const me = await authService.me();
      setUser(me.data);
      // Only merge guest cart for customers — vendors/riders/admins have no cart
      if (me.data.role === 'CUSTOMER') await mergeGuestCart();
      return { error: null, role: me.data.role };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  const signInOtp = useCallback(async (userId: string, code: string) => {
    try {
      const res = await authService.verifyOtp(userId, code);
      saveTokens(res.data.accessToken, res.data.refreshToken);
      const me = await authService.me();
      setUser(me.data);
      if (me.data.role === 'CUSTOMER') await mergeGuestCart();
      return { error: null, role: me.data.role };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await authService.register(name, email, password);
      saveTokens(res.data.accessToken, res.data.refreshToken);
      const me = await authService.me();
      setUser(me.data);
      // New signups are always CUSTOMER role
      if (me.data.role === 'CUSTOMER') await mergeGuestCart();
      return { error: null, role: me.data.role };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  const signOut = useCallback(() => {
    const { refreshToken } = getTokens();
    if (refreshToken) authService.logout(refreshToken);
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.me();
      setUser(res.data);
    } catch {
      // If token/refresh is invalid, ensure we don't keep an unauthenticated user as “logged in”.
      clearTokens();
      setUser(null);
    }
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signIn, signInOtp, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
