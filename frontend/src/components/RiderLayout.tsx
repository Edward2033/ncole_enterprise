import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, DollarSign, User, Bell, LogOut, Sun, Moon, Bike } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const LogoImg: React.FC<{ src: string; className: string; fallback: React.ReactNode }> = ({ src, className, fallback }) => {
  const [err, setErr] = React.useState(false);
  if (err) return <>{fallback}</>;
  return <img src={src} alt="Ncole" className={className} onError={() => setErr(true)} />;
};

const THEME_KEY = 'ncole_theme';

const NAV = [
  { to: '/rider/dashboard',     icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/rider/deliveries',    icon: Truck,           label: 'Deliveries' },
  { to: '/rider/earnings',      icon: DollarSign,      label: 'Earnings'   },
  { to: '/rider/profile',       icon: User,            label: 'Profile'    },
];

const RiderLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { logoUrl } = useSiteLogo();
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { signOut(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'R';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <LogoImg src={logoUrl} className="h-8 w-auto max-w-[100px] object-contain" fallback={
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white"><Bike className="h-4 w-4" /></div>
            } />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Bike className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Rider Portal</p>
            <p className="text-xs text-slate-500">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(d => !d)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NavLink to="/rider/notifications" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="h-5 w-5" />
          </NavLink>
          <button onClick={handleLogout} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 pt-2 pb-safe dark:border-slate-700 dark:bg-slate-900 rider-nav-safe">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition',
            isActive ? 'text-orange-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
          )}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      <FloatingActionButtons
        portal="RIDER"
        accentClass="bg-orange-500"
        greeting="Hi! I'm N-COLE. How can I help with your deliveries today?"
        showWhatsApp={false}
      />
    </div>
  );
};

export default RiderLayout;
