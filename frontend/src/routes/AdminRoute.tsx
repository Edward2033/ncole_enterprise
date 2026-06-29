import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props { children?: React.ReactNode; }

/**
 * Guards any route that requires ADMIN role.
 *
 * - Not authenticated  → /login
 * - Authenticated but not ADMIN → /unauthorized
 * - ADMIN → render children
 *
 * This component is intentionally a hard redirect — admin pages in the
 * public app should never be rendered inside the public Layout.
 */
const AdminRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
};

export default AdminRoute;
