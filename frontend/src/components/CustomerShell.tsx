import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, MapPin, User, Bell,
  LogOut, Menu, X, Sun, Moon, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/account/orders',     icon: ShoppingBag,    label: 'My Orders' },
  { to: '/account/addresses',  icon: MapPin,         label: 'Addresses' },
  { to: '/account/profile',    icon: User,           label: 'Profile' },
  { to: '/account/notifications', icon: Bell,        label: 'Notifications' },
];

const CustomerShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(d => !d);
  };

  const handleLogout = () => { signOut(); navigate('/login'); };

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onClick}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            isActive
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          )}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-sm">N</div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900 dark:text-white">N_COLE</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-orange-500">Interpress</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <NavList />
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-slate-700 flex items-center justify-between">
          <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-bold text-slate-900 dark:text-white">N_COLE Interpress</span>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavList onClick={() => setSidebarOpen(false)} />
            </div>
            <div className="border-t p-4">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:block">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NavLink to="/account/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
            </NavLink>
            <NavLink to="/account/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold dark:bg-orange-900 dark:text-orange-300">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">{user?.name}</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
            </NavLink>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default CustomerShell;
