import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, MapPin, User, Bell,
  CreditCard, LogOut, Menu, X, Sun, Moon, ChevronRight,
  Store,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AiChat } from '@/features/ai/AiChat';

const NAV = [
  { to: '/customer/dashboard',      icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/account/orders',          icon: ShoppingBag,     label: 'My Orders'      },
  { to: '/account/addresses',       icon: MapPin,          label: 'Addresses'      },
  { to: '/account/billing',         icon: CreditCard,      label: 'Billing'        },
  { to: '/account/notifications',   icon: Bell,            label: 'Notifications'  },
  { to: '/account/profile',         icon: User,            label: 'Profile'        },
];

// Map non-customer roles to their correct portal entry
const ROLE_HOME: Record<string, string> = {
  ADMIN:  '/admin/dashboard',
  VENDOR: '/vendor/dashboard',
  RIDER:  '/rider/dashboard',
};

const THEME_KEY = 'ncole_theme';

const CustomerShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
  });

  // Redirect non-customer roles away from customer shell
  if (user && user.role !== 'CUSTOMER') {
    const dest = ROLE_HOME[user.role] ?? '/login';
    return <Navigate to={dest} replace />;
  }
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [dark]);

  // Close drawer on route change
  useEffect(() => { setSidebarOpen(false); }, []);

  const handleLogout = () => { signOut(); navigate('/login'); };

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onClick}
          className={({ isActive }) => cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600 dark:text-slate-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400',
          )}>
          <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="flex-1">{label}</span>
          <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white font-bold text-sm shadow-md shadow-orange-200">
            N
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900 dark:text-white">N_COLE</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-500">Interpress</p>
          </div>
        </div>

        {/* User card */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:from-orange-900/20 dark:to-amber-900/10">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-white text-sm font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              <Store className="h-2.5 w-2.5" /> Customer
            </span>
          </div>

          <NavList />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-700">
          <button onClick={() => setDark(d => !d)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay ────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white text-xs font-bold">N</div>
                <span className="font-bold text-slate-900 dark:text-white">N_COLE Interpress</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* User info */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <NavList onClick={() => setSidebarOpen(false)} />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 p-4">
              <button onClick={() => setDark(d => !d)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 dark:border-slate-700 dark:bg-slate-900/95 lg:px-6">
          <button onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
            aria-label="Open menu">
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Store className="h-4 w-4 text-orange-500" />
            <span>My Account</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setDark(d => !d)}
              className="hidden lg:flex rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NavLink to="/account/notifications"
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
            </NavLink>
            <NavLink to="/account/profile"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-white text-xs font-bold shadow-sm">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block max-w-[120px] truncate">
                {user?.name}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* AI Chat */}
      <AiChat
        portal="CUSTOMER"
        accentClass="bg-orange-500"
        greeting="Hi! I'm your N-COLE assistant. I can help with orders, invoices, and products!"
      />
    </div>
  );
};

export default CustomerShell;
