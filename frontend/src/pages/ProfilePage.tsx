import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User, MapPin, Package, Bell, Settings, Edit2, Save, X,
  Plus, Trash2, Check, ChevronRight, Phone, Mail, Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  usersService, addressesService, ordersService, notificationsService,
  type NcoleAddress, type NcoleOrder, type NcoleNotifPrefs,
} from '@/services/api';
import { formatPrice } from '@/lib/format';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'info' | 'addresses' | 'orders' | 'notifications' | 'settings';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'info', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Recent Orders', icon: Package },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-violet-100 text-violet-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

// ─── Profile Info Tab ─────────────────────────────────────────────────────────
const ProfileInfo: React.FC = () => {
  const { user, signIn } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      await usersService.updateMe({ name: name.trim(), phone: phone.trim() || undefined });
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-2xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {user?.role}
                </span>
                {user?.isActive && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Active</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => { setEditing(e => !e); setError(''); setName(user?.name ?? ''); setPhone(user?.phone ?? ''); }}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-orange-300 hover:text-orange-600 transition">
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </button>
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" /> Profile updated successfully
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" type="tel"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium text-slate-800">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="font-medium text-slate-800">{user?.phone ?? 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Star className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="font-medium text-slate-800">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'long' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Addresses Tab ────────────────────────────────────────────────────────────
const AddressesTab: React.FC = () => {
  const [addresses, setAddresses] = useState<NcoleAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', street: '', district: '', city: '', province: 'Kigali', country: 'Rwanda', label: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    addressesService.list()
      .then(r => setAddresses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await addressesService.create({ ...form, isDefault: addresses.length === 0 });
      setShowForm(false);
      setForm({ fullName: '', phone: '', street: '', district: '', city: '', province: 'Kigali', country: 'Rwanda', label: '' });
      load();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await addressesService.remove(id); load(); } catch { /* silent */ }
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Delivery Addresses</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-600 transition">
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="mb-4 font-semibold text-slate-900">New Address</h3>
          {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            {[
              { k: 'label', ph: 'Label (e.g. Home, Office)', span: true },
              { k: 'fullName', ph: 'Full Name *', span: true },
              { k: 'phone', ph: 'Phone *', span: true },
              { k: 'street', ph: 'Street Address *', span: true },
              { k: 'district', ph: 'District *' },
              { k: 'city', ph: 'City *' },
              { k: 'province', ph: 'Province *' },
            ].map(f => (
              <input key={f.k}
                required={f.ph.includes('*')}
                placeholder={f.ph.replace(' *', '')}
                value={(form as Record<string, string>)[f.k]}
                onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                className={`rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 ${f.span ? 'sm:col-span-2' : ''}`}
              />
            ))}
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={saving}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-200" />
          <p className="mt-3 font-medium text-slate-500">No addresses saved yet</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map(addr => (
            <div key={addr.id} className={`relative rounded-2xl border p-5 ${addr.isDefault ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}>
              {addr.isDefault && (
                <span className="mb-2 inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-600">Default</span>
              )}
              {addr.label && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{addr.label}</p>}
              <p className="font-semibold text-slate-900">{addr.fullName}</p>
              <p className="mt-1 text-sm text-slate-500">{addr.street}</p>
              <p className="text-sm text-slate-500">{addr.district}, {addr.city}</p>
              <p className="text-sm text-slate-500">{addr.province}, {addr.country}</p>
              <p className="mt-1 text-sm text-slate-500">{addr.phone}</p>
              <button onClick={() => handleDelete(addr.id)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Recent Orders Tab ────────────────────────────────────────────────────────
const RecentOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<NcoleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersService.myOrders(1, 5)
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
        <Link to="/orders" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition">
          View All
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-200" />
          <p className="mt-3 font-medium text-slate-500">No orders yet</p>
          <Link to="/shop" className="mt-4 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} to={`/order/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-200 hover:shadow-sm transition">
              <div>
                <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="text-sm text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className="font-bold text-slate-900">{formatPrice(order.total)}</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Notifications Tab ────────────────────────────────────────────────────────
const NotificationsTab: React.FC = () => {
  const [prefs, setPrefs] = useState<NcoleNotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    notificationsService.getPrefs()
      .then(r => setPrefs(r.data))
      .catch(() => setPrefs({ inApp: true, email: true, orderUpdates: true, promotions: false }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof NcoleNotifPrefs) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      await notificationsService.updatePrefs({ [key]: updated[key] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* restore */ setPrefs(prefs); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />;

  const PREF_ROWS: { key: keyof NcoleNotifPrefs; label: string; desc: string }[] = [
    { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications within the platform' },
    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
    { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified when your order status changes' },
    { key: 'promotions', label: 'Promotions & Deals', desc: 'Receive special offers and discount alerts' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
        {saved && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {PREF_ROWS.map(row => (
          <div key={row.key} className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-slate-900">{row.label}</p>
              <p className="text-sm text-slate-500">{row.desc}</p>
            </div>
            <button
              onClick={() => toggle(row.key)}
              disabled={saving}
              aria-pressed={!!prefs?.[row.key]}
              className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/30 disabled:opacity-60 ${prefs?.[row.key] ? 'bg-orange-500' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${prefs?.[row.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Account Settings Tab ─────────────────────────────────────────────────────
const AccountSettingsTab: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        <div className="p-5">
          <p className="font-semibold text-slate-900">Change Password</p>
          <p className="text-sm text-slate-500">Update your account password</p>
          <Link to="/login" className="mt-3 inline-block rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-600 transition">
            Reset via Login
          </Link>
        </div>
        <div className="p-5">
          <p className="font-semibold text-slate-900">Language & Region</p>
          <p className="text-sm text-slate-500">English (Rwanda) · RWF</p>
        </div>
        <div className="p-5">
          <p className="mb-1 font-semibold text-red-600">Sign Out</p>
          <p className="text-sm text-slate-500">Sign out of your N_COLE account</p>
          <button onClick={signOut}
            className="mt-3 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">My Account</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar nav */}
        <nav className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:w-52 lg:flex-shrink-0 lg:pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}>
                <Icon className="h-4 w-4 flex-shrink-0" /> {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'info' && <ProfileInfo />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'orders' && <RecentOrdersTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'settings' && <AccountSettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
