import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, BarChart2,
  User, LogOut, Menu, X, Sun, Moon, Store, Bell, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import FloatingActionButtons from '@/components/FloatingActionButtons';

const NAV = [
  { to: '/vendor/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/vendor/products',       icon: Package,         label: 'Products'      },
  { to: '/vendor/orders',         icon: ShoppingBag,     label: 'Orders'        },
  { to: '/vendor/analytics',      icon: BarChart2,       label: 'Analytics'     },
  { to: '/vendor/notifications',  icon: Bell,            label: 'Notifications' },
  { to: '/vendor/profile',        icon: User,            label: 'Store Profile' },
];

const THEME_KEY = 'ncole_theme';

const VendorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [dark]);

  const toggleDark = () => setDark(d => !d);
  const handleLogout = () => { signOut(); navigate('/login'); };

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onClick}
          className={({ isActive }) => cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-900/20 dark:hover:text-violet-300',
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
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900 dark:text-white">N_COLE</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-violet-500">Vendor Portal</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <div className="rounded-xl bg-violet-50 px-3 py-3 dark:bg-violet-900/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold mb-2">
              {user?.name?.[0]?.toUpperCase() ?? 'V'}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              Vendor
            </span>
          </div>
          <NavItems />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-700">
          <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white">Vendor Portal</span>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><NavItems onClick={() => setOpen(false)} /></div>
            <div className="border-t p-4 dark:border-slate-700">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 lg:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vendor Dashboard</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:block">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold dark:bg-violet-900/30 dark:text-violet-300">
              {user?.name?.[0]?.toUpperCase() ?? 'V'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in duration-300">{children}</main>
      </div>
      <FloatingActionButtons
        portal="VENDOR"
        accentClass="bg-violet-600"
        greeting="Hi! I'm N-COLE. How can I help with your vendor store today?"
        showWhatsApp={false}
      />
    </div>
  );
};

export default VendorLayout;
