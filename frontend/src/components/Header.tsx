import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, User, ShoppingBag, LogOut, Package, Bell, UserCircle, FileText } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollections } from '@/hooks/useProducts';
import { notificationsService } from '@/services/api';

const Header: React.FC = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut, isAuthenticated } = useAuth();
  const collections = useCollections();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread notification count when authenticated
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    notificationsService.list()
      .then(r => setUnreadCount(r.data.filter(n => !n.isRead).length))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-2 text-center text-xs font-medium text-white">
        🇷🇼 Free delivery across Rwanda · MTN MoMo &amp; Airtel Money accepted · Verified vendors only
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 lg:px-8">
        <button onClick={() => setMobileOpen(v => !v)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block font-bold text-slate-900 text-base">N_COLE</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-orange-500">Interpress</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">Home</Link>
          <Link to="/shop" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">Shop</Link>
          {collections.slice(0, 4).map(c => (
            <Link key={c.id} to={`/shop/category/${c.handle}`}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
              {c.title}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-3">
          {isAuthenticated ? (
            <>
              <Link to="/orders"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex transition-colors">
                <Package className="h-4 w-4" /> Orders
              </Link>

              {/* Notification bell */}
              <Link to="/notifications"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors sm:flex"
                aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User dropdown */}
              <div className="group relative hidden sm:block">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-sm font-bold hover:bg-orange-200 transition-colors"
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </button>
                <div className="invisible absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl group-hover:visible z-50">
                  <div className="border-b border-slate-100 px-4 pb-3 pt-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                    <UserCircle className="h-4 w-4" /> My Profile
                  </Link>
                  <Link to="/orders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  <Link to="/notifications"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/billing"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                    <FileText className="h-4 w-4" /> Billing
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login"
              className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex transition-colors">
              <User className="h-4 w-4" /> Sign In
            </Link>
          )}

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={`Cart (${totalItems} items)`}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                aria-label="Search"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }].map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </Link>
            ))}
            {collections.slice(0, 6).map(c => (
              <Link key={c.id} to={`/shop/category/${c.handle}`} onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                {c.title}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="my-1 h-px bg-slate-100" />
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Profile</Link>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Orders</Link>
                <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Notifications
                  {unreadCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>}
                </Link>
                <Link to="/billing" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Billing</Link>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="mt-1 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50">
                Sign In / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
