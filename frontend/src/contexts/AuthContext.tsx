import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, saveTokens, clearTokens, getTokens, type NcoleUser } from '@/services/api';

interface AuthContextValue {
  user: NcoleUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signOut: () => void;
  /** Re-fetch /users/me and update the context user — call after profile updates */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<NcoleUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from stored tokens on mount
useEffect(() => {
    const { accessToken } = getTokens();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // IMPORTANT: only call /me while we have a token.
    // If it fails (401/refresh invalid), we clear tokens to avoid repeated /users/me spam.
    authService
      .me()
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        clearTokens();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);


  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      saveTokens(res.data.accessToken, res.data.refreshToken);
      const me = await authService.me();
      setUser(me.data);
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
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
