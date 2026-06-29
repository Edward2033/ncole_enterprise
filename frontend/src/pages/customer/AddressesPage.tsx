import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Star, MapPin, X, Save, Home, Briefcase } from 'lucide-react';
import { addressesService, type NcoleAddress } from '@/services/api';

type AddrForm = {
  label: string; fullName: string; phone: string;
  street: string; district: string; city: string;
  province: string; country: string; isDefault: boolean;
};

const EMPTY: AddrForm = {
  label: '', fullName: '', phone: '',
  street: '', district: '', city: '',
  province: '', country: 'Rwanda', isDefault: false,
};

const InputField: React.FC<{
  label: string; value: string; required?: boolean;
  placeholder?: string; onChange: (v: string) => void;
  error?: string;
}> = ({ label, value, required, placeholder, onChange, error }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all
        dark:bg-slate-800 dark:text-white
        focus:ring-2 focus:ring-orange-400/20
        ${error
          ? 'border-red-400 focus:border-red-400'
          : 'border-slate-200 dark:border-slate-700 focus:border-orange-400 bg-white'
        }`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const AddressesPage: React.FC = () => {
  const [items, setItems]       = useState<NcoleAddress[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<NcoleAddress | null>(null);
  const [form, setForm]         = useState<AddrForm>(EMPTY);
  const [errors, setErrors]     = useState<Partial<AddrForm>>({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    addressesService.list()
      .then(r => setItems(r.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setSaveError('');
    setShowForm(true);
  };

  const openEdit = (addr: NcoleAddress) => {
    setEditing(addr);
    setForm({
      label: addr.label ?? '', fullName: addr.fullName,
      phone: addr.phone, street: addr.street,
      district: addr.district, city: addr.city,
      province: addr.province, country: addr.country,
      isDefault: addr.isDefault,
    });
    setErrors({});
    setSaveError('');
    setShowForm(true);
  };

  const set = (k: keyof AddrForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: Partial<AddrForm> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.phone.trim())    e.phone    = 'Required';
    if (!form.street.trim())   e.street   = 'Required';
    if (!form.district.trim()) e.district = 'Required';
    if (!form.city.trim())     e.city     = 'Required';
    if (!form.province.trim()) e.province = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editing) {
        await addressesService.update(editing.id, form);
      } else {
        await addressesService.create({ ...form, isDefault: items.length === 0 ? true : form.isDefault });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setSaveError((err as Error).message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await addressesService.remove(id).catch(() => null);
    load();
  };

  const getLabelIcon = (label?: string) => {
    const l = (label ?? '').toLowerCase();
    if (l.includes('home')) return <Home className="h-3.5 w-3.5" />;
    if (l.includes('office') || l.includes('work')) return <Briefcase className="h-3.5 w-3.5" />;
    return <MapPin className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-400">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Addresses</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {items.length} saved address{items.length !== 1 ? 'es' : ''}
          </p>
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 transition-all duration-200 active:scale-95">
            <Plus className="h-4 w-4" /> Add Address
          </button>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-md dark:border-orange-800/30 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {editing ? 'Edit Address' : 'New Address'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputField label="Label" value={form.label} onChange={v => set('label', v)} placeholder="e.g. Home, Office" />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Full Name" required value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Phone" required value={form.phone} onChange={v => set('phone', v)} placeholder="+250 7XX XXX XXX" error={errors.phone} />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Street Address" required value={form.street} onChange={v => set('street', v)} error={errors.street} />
              </div>
              <InputField label="District" required value={form.district} onChange={v => set('district', v)} error={errors.district} />
              <InputField label="City" required value={form.city} onChange={v => set('city', v)} error={errors.city} />
              <InputField label="Province" required value={form.province} onChange={v => set('province', v)} error={errors.province} />
              <InputField label="Country" value={form.country} onChange={v => set('country', v)} />

              <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
                <div
                  onClick={() => set('isDefault', !form.isDefault)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${form.isDefault ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.isDefault ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Set as default address</span>
              </label>

              <div className="flex gap-3 sm:col-span-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm shadow-orange-200 active:scale-95">
                  {saving
                    ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving…</>
                    : <><Save className="h-4 w-4" />Save Address</>
                  }
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 && !showForm ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center animate-in fade-in duration-400">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
            <MapPin className="h-8 w-8 text-orange-300" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No addresses yet</p>
          <p className="mt-1 text-sm text-slate-400">Add a delivery address to speed up checkout</p>
          <button onClick={openCreate}
            className="mt-5 flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((addr, i) => (
            <div
              key={addr.id}
              className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2
                ${addr.isDefault
                  ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/10'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Default badge */}
              {addr.isDefault && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/40 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-300">
                  <Star className="h-2.5 w-2.5" /> Default
                </span>
              )}

              {/* Label */}
              {addr.label && (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {getLabelIcon(addr.label)}
                  {addr.label}
                </div>
              )}

              <p className="font-semibold text-slate-900 dark:text-white">{addr.fullName}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{addr.street}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{addr.district}, {addr.city}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{addr.province}, {addr.country}</p>
              <p className="mt-1 text-sm text-slate-400">{addr.phone}</p>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(addr)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600 transition-colors">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-red-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
