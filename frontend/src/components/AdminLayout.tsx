import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  FolderOpen, BarChart2, Settings, CreditCard, Bell, Bike,
  LogOut, Menu, X, Shield, ClipboardList, Bot, FileText, Globe, Star,
  Sun, Moon,
} from 'lucide-react';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const THEME_KEY = 'ncole_theme';

const NAV = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/admin/users',         icon: Users,           label: 'Users' },
  { to: '/admin/vendors',       icon: Store,           label: 'Vendors' },
  { to: '/admin/applications',  icon: FileText,        label: 'Applications' },
  { to: '/admin/products',      icon: Package,         label: 'Products' },
  { to: '/admin/orders',        icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/categories',    icon: FolderOpen,      label: 'Categories' },
  { to: '/admin/billing',       icon: CreditCard,      label: 'Billing' },
  { to: '/admin/riders',        icon: Bike,            label: 'Riders' },
  { to: '/admin/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/admin/analytics',     icon: BarChart2,       label: 'Analytics' },
  { to: '/admin/testimonials',  icon: Star,            label: 'Testimonials' },
  { to: '/admin/activity-log',  icon: ClipboardList,   label: 'Activity Log' },
  { to: '/admin/ai-settings',   icon: Bot,             label: 'AI Settings' },
  { to: '/admin/site-settings', icon: Globe,           label: 'Site Settings' },
  { to: '/admin/settings',      icon: Settings,        label: 'Settings' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-orange-500 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

const LogoImg: React.FC<{ src: string; className: string; fallback: React.ReactNode }> = ({ src, className, fallback }) => {
  const [err, setErr] = React.useState(false);
  if (err) return <>{fallback}</>;
  return <img src={src} alt="Ncole" className={className} onError={() => setErr(true)} />;
};

const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { logoUrl } = useSiteLogo();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
  });

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Theme sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'A';

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-0.5">
      {NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onClick} className={linkClass}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        {/* Logo */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <LogoImg src={logoUrl} className="h-8 w-auto max-w-[110px] object-contain" fallback={
                <><div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white"><Shield className="h-4 w-4" /></div><div><p className="font-bold text-slate-900 dark:text-white text-sm">Ncole Admin</p><p className="text-[11px] text-slate-500">Administrator Portal</p></div></>
              } />
            ) : (
              <>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Ncole Admin</p>
                  <p className="text-[11px] text-slate-500">Administrator Portal</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3">
          <NavItems />
        </div>

        {/* User footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-3">
          <button
            onClick={() => setDark(d => !d)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition mb-1"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <Link to="/admin/profile" className="flex items-center gap-2 mb-2 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition py-1">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              {logoUrl ? (
                <LogoImg src={logoUrl} className="h-7 w-auto max-w-[100px] object-contain" fallback={<span className="font-bold text-sm dark:text-white">Ncole Admin</span>} />
              ) : (
                <span className="font-bold text-sm dark:text-white">Ncole Admin</span>
              )}
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavItems onClick={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-1">
              <button
                onClick={() => setDark(d => !d)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-500">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile hamburger + user chip) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => setDark(d => !d)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/admin/profile" className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                  {initials}
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Page content — each admin page renders here */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <FloatingActionButtons
        portal="ADMIN"
        accentClass="bg-orange-500"
        greeting="Hi! I'm Ncole Admin AI. How can I help with platform analytics today?"
        showWhatsApp={false}
      />
    </div>
  );
};

export default AdminLayout;
