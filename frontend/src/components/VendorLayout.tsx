import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, BarChart2,
  User, LogOut, Menu, X, Sun, Moon, Store, Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import FloatingActionButtons from '@/components/FloatingActionButtons';

const NAV = [
  { to: '/vendor/dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/vendor/products',      icon: Package,         label: 'Products'      },
  { to: '/vendor/orders',        icon: ShoppingBag,     label: 'Orders'        },
  { to: '/vendor/analytics',     icon: BarChart2,       label: 'Analytics'     },
  { to: '/vendor/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/vendor/profile',       icon: User,            label: 'Store Profile' },
];

const THEME_KEY = 'ncole_theme';

const VendorLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { signOut(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'V';

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/vendor/dashboard'} onClick={onClick}
          className={({ isActive }) => cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
              : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300',
          )}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30">
          <Store className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-extrabold text-slate-900 dark:text-white tracking-tight">Ncole</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">Vendor Portal</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-4 border border-violet-100 dark:border-violet-800/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/40 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Vendor
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Menu</p>
        <NavItems onClick={onNavClick} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-700/60 p-3 space-y-1">
        <button
          onClick={() => setDark(d => !d)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 lg:flex">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
              <span className="font-extrabold text-slate-900 dark:text-white">Vendor Portal</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <SidebarContent onNavClick={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-3 lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Page title area (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Vendor Dashboard</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setDark(d => !d)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children ?? <Outlet />}
        </main>
      </div>

      <FloatingActionButtons
        portal="VENDOR"
        accentClass="bg-violet-600"
        greeting="Hi! I'm Ncole AI. How can I help with your vendor store today?"
        showWhatsApp={false}
      />
    </div>
  );
};

export default VendorLayout;
