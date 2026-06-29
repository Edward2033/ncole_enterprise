import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Settings, Edit2, Save, X, Check,
  Phone, Mail, Star, Shield, Globe, LogOut,
  MapPin, ShoppingBag, Bell, CreditCard, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService } from '@/services/api';

// ── Profile info section ──────────────────────────────────────────────────────
const ProfileInfo: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name ?? '');
  const [phone,   setPhone]   = useState(user?.phone ?? '');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      await usersService.updateMe({ name: name.trim(), phone: phone.trim() || undefined });
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Avatar + identity card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-2xl font-bold text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {user?.role}
                </span>
                {user?.isActive && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => { setEditing(e => !e); setError(''); setName(user?.name ?? ''); setPhone(user?.phone ?? ''); }}
            className="rounded-xl border border-slate-200 dark:border-slate-600 p-2 text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </button>
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
            <Check className="h-4 w-4" /> Profile updated successfully
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {error && (
              <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" type="tel"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm shadow-orange-200 active:scale-95">
                {saving
                  ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving…</>
                  : <><Save className="h-4 w-4" />Save Changes</>
                }
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 grid gap-3 text-sm">
            {[
              { icon: <Mail className="h-4 w-4 text-orange-400" />,  label: 'Email',       value: user?.email ?? '—' },
              { icon: <Phone className="h-4 w-4 text-orange-400" />, label: 'Phone',       value: user?.phone ?? 'Not set' },
              { icon: <Star className="h-4 w-4 text-orange-400" />,  label: 'Member Since',value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'long' }) : '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-3 transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/10">
                <div className="flex-shrink-0">{row.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links to other account sections */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
        {[
          { to: '/account/orders',        icon: <ShoppingBag className="h-4 w-4 text-violet-500" />,  label: 'My Orders',     desc: 'Track and view all orders' },
          { to: '/account/addresses',     icon: <MapPin className="h-4 w-4 text-rose-500" />,         label: 'Addresses',     desc: 'Manage delivery addresses' },
          { to: '/account/billing',       icon: <CreditCard className="h-4 w-4 text-blue-500" />,     label: 'Billing',       desc: 'Invoices and payment history' },
          { to: '/account/notifications', icon: <Bell className="h-4 w-4 text-amber-500" />,          label: 'Notifications', desc: 'Manage notification preferences' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="group flex items-center gap-4 px-5 py-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Account Settings section ──────────────────────────────────────────────────
const AccountSettings: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="h-4 w-4 text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Change Password</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Update your account password via the login page</p>
          <Link to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 transition-colors">
            Reset Password
          </Link>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Globe className="h-4 w-4 text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Language & Region</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">English (Rwanda) · RWF · Africa/Kigali</p>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <LogOut className="h-4 w-4 text-red-500" />
            <p className="font-semibold text-red-600">Sign Out</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign out of your N_COLE Interpress account</p>
          <button onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ProfilePage ──────────────────────────────────────────────────────────
type Tab = 'info' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'info',     label: 'Profile',  icon: User     },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-400">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage your personal information and account settings</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-1 w-fit animate-in fade-in duration-400">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {activeTab === 'info'     && <ProfileInfo />}
        {activeTab === 'settings' && <AccountSettings />}
      </div>
    </div>
  );
};

export default ProfilePage;
