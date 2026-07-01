import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, User, KeyRound, Globe, Shield, Layers, Image as ImageIcon,
  ToggleLeft, ToggleRight, ChevronRight, CheckCircle, Lock,
  Edit2, Save, X, Plus, Trash2, Pencil, AlertCircle, RefreshCw,
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

// ─── Site link options (shared by Hero Slides + Banners) ─────────────────────

const BUTTON_TEXT_OPTIONS = [
  'Shop Now', 'Explore', 'View Collection', 'Learn More', 'Get Started',
  'Order Now', 'See Deals', 'Browse Products', 'Become a Vendor', 'Apply Now',
  'Contact Us', 'View All',
];

const BUTTON_LINK_OPTIONS = [
  { label: 'Storefront — Home',          value: '/' },
  { label: 'Shop — All Products',        value: '/shop' },
  { label: 'Apply (Vendor / Rider)',      value: '/apply' },
  { label: 'Login / Register',           value: '/login' },
  { label: 'Cart',                       value: '/cart' },
  { label: 'Orders',                     value: '/orders' },
  { label: 'Customer Dashboard',         value: '/customer/dashboard' },
  { label: 'Vendor Dashboard',           value: '/vendor/dashboard' },
  { label: 'Rider Dashboard',            value: '/rider/dashboard' },
  { label: 'Admin Dashboard',            value: '/admin/dashboard' },
  { label: 'Billing',                    value: '/account/billing' },
  { label: 'Notifications',              value: '/account/notifications' },
];

const selectCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition disabled:opacity-60 disabled:cursor-not-allowed';

const ButtonTextSelect: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <select className={selectCls} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
    <option value="">— None —</option>
    {BUTTON_TEXT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
    {value && !BUTTON_TEXT_OPTIONS.includes(value) && <option value={value}>{value}</option>}
  </select>
);

const ButtonLinkSelect: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <select className={selectCls} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
    <option value="">— None —</option>
    {BUTTON_LINK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    {value && !BUTTON_LINK_OPTIONS.some(o => o.value === value) && <option value={value}>{value}</option>}
  </select>
);
import { adminUsersApi, adminSettingsApi, type PlatformConfig, type HeroSlide, type Banner, type MaintenanceConfig } from '@/services/adminApi';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { fmtDate } from '@/lib/adminFormat';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition disabled:opacity-60 disabled:cursor-not-allowed';

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white break-all text-right max-w-[65%]">{value}</span>
  </div>
);

const SectionCard: React.FC<{ id: string; icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ id, icon, title, children }) => (
  <div id={id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600">{icon}</div>
      <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const Alert: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
    type === 'success'
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
  }`}>
    {type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
    {message}
  </div>
);

const Spinner = () => <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white inline-block" />;

const Skeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1,2,3].map(i => <div key={i} className="h-8 rounded-xl bg-slate-100 dark:bg-slate-700" />)}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// ─── SECTION: Platform Config ─────────────────────────────────────────────────

const PlatformSection: React.FC = () => {
  const [config, setConfig]   = useState<PlatformConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminSettingsApi.getPlatform(); setConfig(r.data); }
    catch { /* use defaults on first load if table not seeded */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => { setForm(config ? { ...config } : null); setEditing(true); setError(''); setSuccess(false); };
  const cancelEdit = () => { setEditing(false); setError(''); };

  const setField = (k: keyof PlatformConfig, v: string) =>
    setForm(f => f ? { ...f, [k]: v } : f);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError('');
    try {
      const r = await adminSettingsApi.updatePlatform(form);
      setConfig(r.data);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) { setError((err as Error).message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <Skeleton />;

  const FIELDS: { key: keyof PlatformConfig; label: string; type?: string }[] = [
    { key: 'platformName',      label: 'Platform Name' },
    { key: 'version',           label: 'Version' },
    { key: 'storefrontUrl',     label: 'Storefront URL',       type: 'url' },
    { key: 'customerPortalUrl', label: 'Customer Portal URL',  type: 'url' },
    { key: 'vendorPortalUrl',   label: 'Vendor Portal URL',    type: 'url' },
    { key: 'riderPortalUrl',    label: 'Rider Portal URL',     type: 'url' },
  ];

  return (
    <>
      {success && <Alert type="success" message="Platform configuration saved." />}
      {error   && <Alert type="error"   message={error} />}
      {editing && form ? (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map(f => (
              <Field key={f.key} label={f.label}>
                <input type={f.type ?? 'text'} className={inputCls} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
              </Field>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
              {saving && <Spinner />}<Save className="h-4 w-4" /> Save Changes
            </button>
            <button type="button" onClick={cancelEdit} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={startEdit} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <div className="space-y-2">
            {FIELDS.map(f => <InfoRow key={f.key} label={f.label} value={config ? config[f.key] : '—'} />)}
          </div>
        </>
      )}
    </>
  );
};

// ─── SECTION: Hero Slides ─────────────────────────────────────────────────────

const EMPTY_SLIDE = { title: '', subtitle: '', imageUrl: '', buttonText: '', buttonLink: '', isActive: true, sortOrder: 0 };

const HeroSection: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; slide?: HeroSlide } | null>(null);
  const [form, setForm] = useState(EMPTY_SLIDE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await adminSettingsApi.getSlides(); setSlides(r.data); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_SLIDE); setFormError(''); setModal({ mode: 'create' }); };
  const openEdit = (s: HeroSlide) => { setForm({ title: s.title, subtitle: s.subtitle ?? '', imageUrl: s.imageUrl, buttonText: s.buttonText ?? '', buttonLink: s.buttonLink ?? '', isActive: s.isActive, sortOrder: s.sortOrder }); setFormError(''); setModal({ mode: 'edit', slide: s }); };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.imageUrl.trim()) { setFormError('Image URL is required'); return; }
    setSaving(true);
    try {
      const body = { ...form, subtitle: form.subtitle || undefined, buttonText: form.buttonText || undefined, buttonLink: form.buttonLink || undefined };
      if (modal?.mode === 'edit' && modal.slide) { await adminSettingsApi.updateSlide(modal.slide.id, body); }
      else { await adminSettingsApi.createSlide(body); }
      await load(); setModal(null);
    } catch (err) { setFormError((err as Error).message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!delId) return; setDeleting(true);
    try { await adminSettingsApi.deleteSlide(delId); await load(); setDelId(null); }
    catch (e) { setError((e as Error).message); }
    finally { setDeleting(false); }
  };

  const toggleActive = async (s: HeroSlide) => {
    try { await adminSettingsApi.updateSlide(s.id, { isActive: !s.isActive }); await load(); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{slides.length} slide{slides.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"><Plus className="h-3.5 w-3.5" /> Add Slide</button>
      </div>
      {error && <Alert type="error" message={error} />}
      {loading ? <Skeleton /> : slides.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-slate-400 text-sm">No slides yet. Add your first hero slide.</div>
      ) : (
        <div className="space-y-3">
          {slides.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
              {s.imageUrl && <img src={s.imageUrl} alt={s.title} className="h-12 w-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{s.title}</p>
                {s.subtitle && <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(s)} title={s.isActive ? 'Deactivate' : 'Activate'} className={`rounded-lg p-1.5 transition ${s.isActive ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {s.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDelId(s.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Slide' : 'New Slide'}>
        <form onSubmit={saveForm} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          <Field label="Title" required><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Subtitle"><input className={inputCls} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></Field>
          <Field label="Image" required>
            <ImageUploader
              value={form.imageUrl}
              onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              disabled={saving}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text">
              <ButtonTextSelect value={form.buttonText} onChange={v => setForm(f => ({ ...f, buttonText: v }))} disabled={saving} />
            </Field>
            <Field label="Button Link">
              <ButtonLinkSelect value={form.buttonLink} onChange={v => setForm(f => ({ ...f, buttonLink: v }))} disabled={saving} />
            </Field>
            <Field label="Sort Order"><input className={inputCls} type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></Field>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sl-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <label htmlFor="sl-active" className="text-sm text-slate-700 dark:text-slate-300">Active</label>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving || !form.imageUrl} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">{saving && <Spinner />}{modal?.mode === 'edit' ? 'Save Changes' : 'Create Slide'}</button>
            <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          </div>
        </form>
      </Modal>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative z-10 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-slate-900 dark:text-white mb-2">Delete Slide</p>
            <p className="text-sm text-slate-500 mb-5">This slide will be permanently removed.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDelId(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition">{deleting && <Spinner />}Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── SECTION: Banners ─────────────────────────────────────────────────────────

const EMPTY_BANNER = { title: '', description: '', imageUrl: '', buttonText: '', linkUrl: '', isActive: true, startDate: '', endDate: '' };

const BannersSection: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<{ mode: 'create' | 'edit'; banner?: Banner } | null>(null);
  const [form, setForm]       = useState(EMPTY_BANNER);
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');
  const [delId, setDelId]     = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await adminSettingsApi.getBanners(); setBanners(r.data); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_BANNER); setFormError(''); setModal({ mode: 'create' }); };
  const openEdit   = (b: Banner) => { setForm({ title: b.title, description: b.description ?? '', imageUrl: b.imageUrl, buttonText: b.buttonText ?? '', linkUrl: b.linkUrl ?? '', isActive: b.isActive, startDate: b.startDate ?? '', endDate: b.endDate ?? '' }); setFormError(''); setModal({ mode: 'edit', banner: b }); };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim())    { setFormError('Title is required');     return; }
    if (!form.imageUrl.trim()) { setFormError('Image URL is required'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        description: form.description || undefined,
        buttonText:  form.buttonText  || undefined,
        linkUrl:     form.linkUrl     || undefined,
        startDate:   form.startDate   ? new Date(form.startDate).toISOString() : undefined,
        endDate:     form.endDate     ? new Date(form.endDate).toISOString()   : undefined,
      };
      if (modal?.mode === 'edit' && modal.banner) { await adminSettingsApi.updateBanner(modal.banner.id, body); }
      else { await adminSettingsApi.createBanner(body); }
      await load(); setModal(null);
    } catch (err) { setFormError((err as Error).message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!delId) return; setDeleting(true);
    try { await adminSettingsApi.deleteBanner(delId); await load(); setDelId(null); }
    catch (e) { setError((e as Error).message); }
    finally { setDeleting(false); }
  };

  const toggleActive = async (b: Banner) => {
    try { await adminSettingsApi.updateBanner(b.id, { isActive: !b.isActive }); await load(); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"><Plus className="h-3.5 w-3.5" /> Add Banner</button>
      </div>
      {error && <Alert type="error" message={error} />}
      {loading ? <Skeleton /> : banners.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-slate-400 text-sm">No banners yet. Add your first promotional banner.</div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
              {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="h-12 w-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{b.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {b.startDate && <span>From {fmtDate(b.startDate)}</span>}
                  {b.endDate   && <span>Until {fmtDate(b.endDate)}</span>}
                  {!b.startDate && !b.endDate && <span>No schedule</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(b)} title={b.isActive ? 'Deactivate' : 'Activate'} className={`rounded-lg p-1.5 transition ${b.isActive ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {b.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDelId(b.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Banner' : 'New Banner'}>
        <form onSubmit={saveForm} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          <Field label="Title" required><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Description"><textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Image" required>
            <ImageUploader
              value={form.imageUrl}
              onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              disabled={saving}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text">
              <ButtonTextSelect value={form.buttonText} onChange={v => setForm(f => ({ ...f, buttonText: v }))} disabled={saving} />
            </Field>
            <Field label="Button Link">
              <ButtonLinkSelect value={form.linkUrl} onChange={v => setForm(f => ({ ...f, linkUrl: v }))} disabled={saving} />
            </Field>
            <Field label="Start Date"><input className={inputCls} type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
            <Field label="End Date"><input className={inputCls} type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></Field>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="bn-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <label htmlFor="bn-active" className="text-sm text-slate-700 dark:text-slate-300">Active</label>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving || !form.imageUrl} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">{saving && <Spinner />}{modal?.mode === 'edit' ? 'Save Changes' : 'Create Banner'}</button>
            <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          </div>
        </form>
      </Modal>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative z-10 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-slate-900 dark:text-white mb-2">Delete Banner</p>
            <p className="text-sm text-slate-500 mb-5">This banner will be permanently removed.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDelId(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition">{deleting && <Spinner />}Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── SECTION: Maintenance ─────────────────────────────────────────────────────

const MaintenanceSection: React.FC = () => {
  const [config, setConfig]   = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await adminSettingsApi.getMaintenance(); setConfig(r.data); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: Partial<MaintenanceConfig>) => {
    if (!config) return;
    setSaving(true); setError(''); setSuccess(false);
    const next = { ...config, ...patch };
    try {
      const r = await adminSettingsApi.updateMaintenance(next);
      setConfig(r.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const toggleEnabled = () => { if (config) save({ enabled: !config.enabled }); };

  const handleMessageBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (config && e.target.value !== config.message) save({ message: e.target.value });
  };

  const handleCheckbox = (key: keyof Pick<MaintenanceConfig, 'allowAdmins' | 'allowVendors' | 'allowRiders'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => { if (config) save({ [key]: e.target.checked }); };

  if (loading) return <Skeleton />;

  return (
    <>
      {success && <Alert type="success" message="Maintenance settings saved." />}
      {error   && <Alert type="error"   message={error} />}

      {/* Master toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-4 mb-5">
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">Maintenance Mode</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {config?.enabled ? 'Platform is currently under maintenance.' : 'Platform is operating normally.'}
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={saving}
          title={config?.enabled ? 'Disable maintenance mode' : 'Enable maintenance mode'}
          className={`rounded-lg p-1.5 transition disabled:opacity-50 ${config?.enabled ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        >
          {config?.enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
        </button>
      </div>

      {/* Message */}
      <Field label="Maintenance Message">
        <textarea
          key={config?.message}
          className={`${inputCls} resize-none`}
          rows={3}
          defaultValue={config?.message ?? ''}
          onBlur={handleMessageBlur}
          placeholder="We are performing scheduled maintenance. Please check back soon."
        />
        <p className="text-xs text-slate-400 mt-1">Saved automatically when you leave the field.</p>
      </Field>

      {/* Role exceptions */}
      <div className="mt-5 space-y-3">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">Allow access during maintenance</p>
        {(
          [
            { key: 'allowAdmins',  label: 'Admins'  },
            { key: 'allowVendors', label: 'Vendors' },
            { key: 'allowRiders',  label: 'Riders'  },
          ] as { key: keyof Pick<MaintenanceConfig, 'allowAdmins' | 'allowVendors' | 'allowRiders'>; label: string }[]
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400"
              checked={config ? config[key] : false}
              onChange={handleCheckbox(key)}
              disabled={saving}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
          </label>
        ))}
      </div>
    </>
  );
};

// ─── SECTION: Password ────────────────────────────────────────────────────────

const PasswordSection: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [fieldError, setFieldError] = useState('');

  const reset = () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setFieldError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false); setFieldError('');

    if (!currentPassword.trim()) { setFieldError('Current password is required.');           return; }
    if (newPassword.length < 8)  { setFieldError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setFieldError('Passwords do not match.');           return; }

    setSaving(true);
    try {
      await adminUsersApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) { setError((err as Error).message || 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {success    && <Alert type="success" message="Password changed successfully." />}
      {error      && <Alert type="error"   message={error} />}
      {fieldError && <Alert type="error"   message={fieldError} />}

      <Field label="Current Password" required>
        <input
          type="password"
          className={inputCls}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>

      <Field label="New Password" required>
        <input
          type="password"
          className={inputCls}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
        />
      </Field>

      <Field label="Confirm New Password" required>
        <input
          type="password"
          className={inputCls}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>

      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
        >
          {saving && <Spinner />}<Lock className="h-4 w-4" /> Change Password
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          Clear
        </button>
      </div>
    </form>
  );
};

// ─── SECTION: Profile ─────────────────────────────────────────────────────────

const ProfileSection: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  // Sync form values whenever user changes or edit mode opens
  useEffect(() => {
    if (editing) {
      setName(user?.name  ?? '');
      setPhone(user?.phone ?? '');
    }
  }, [editing, user]);

  const cancelEdit = () => { setEditing(false); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }),
      });
      await refreshUser();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) { setError((err as Error).message || 'Failed to save profile.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      {success && <Alert type="success" message="Profile updated successfully." />}
      {error   && <Alert type="error"   message={error} />}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Field label="Full Name" required>
            <input
              type="text"
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              className={inputCls}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+250 7XX XXX XXX"
              autoComplete="tel"
            />
          </Field>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {saving && <Spinner />}<Save className="h-4 w-4" /> Save Changes
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setError(''); setSuccess(false); setEditing(true); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <div className="space-y-2">
            <InfoRow label="Name"   value={user?.name  ?? '—'} />
            <InfoRow label="Email"  value={user?.email ?? '—'} />
            <InfoRow label="Phone"  value={user?.phone ?? 'Not set'} />
            <InfoRow label="Role"   value={user?.role  ?? '—'} />
            <InfoRow label="Status" value={user?.isActive ? 'Active' : 'Suspended'} />
          </div>
        </>
      )}
    </>
  );
};

// ─── Root page ────────────────────────────────────────────────────────────────

type SectionId = 'platform' | 'hero' | 'banners' | 'maintenance' | 'profile' | 'password';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'platform',    label: 'Platform',    icon: <Globe      className="h-4 w-4" /> },
  { id: 'hero',        label: 'Hero Slides', icon: <Layers     className="h-4 w-4" /> },
  { id: 'banners',     label: 'Banners',     icon: <ImageIcon  className="h-4 w-4" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Shield     className="h-4 w-4" /> },
  { id: 'profile',     label: 'My Profile',  icon: <User       className="h-4 w-4" /> },
  { id: 'password',    label: 'Password',    icon: <KeyRound   className="h-4 w-4" /> },
];

const SECTION_META: Record<SectionId, { title: string; icon: React.ReactNode }> = {
  platform:    { title: 'Platform Configuration', icon: <Globe     className="h-4 w-4" /> },
  hero:        { title: 'Hero Slideshow',          icon: <Layers    className="h-4 w-4" /> },
  banners:     { title: 'Promotional Banners',     icon: <ImageIcon className="h-4 w-4" /> },
  maintenance: { title: 'Maintenance Mode',        icon: <Shield    className="h-4 w-4" /> },
  profile:     { title: 'Admin Profile',           icon: <User      className="h-4 w-4" /> },
  password:    { title: 'Change Password',         icon: <KeyRound  className="h-4 w-4" /> },
};

const AdminSettingsPage: React.FC = () => {
  const [active, setActive] = useState<SectionId>('platform');

  const meta = SECTION_META[active];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500">Platform configuration, content management and account settings</p>
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left sidebar ── */}
        <nav className="hidden lg:flex w-52 flex-shrink-0 flex-col gap-0.5 sticky top-20">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left ${
                active === item.id
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {active === item.id && <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </nav>

        {/* ── Mobile nav (horizontal scroll) ── */}
        <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1 w-full">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active === item.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </div>

        {/* ── Section content ── */}
        <div className="flex-1 min-w-0">
          <SectionCard id={active} icon={meta.icon} title={meta.title}>
            {active === 'platform'    && <PlatformSection />}
            {active === 'hero'        && <HeroSection />}
            {active === 'banners'     && <BannersSection />}
            {active === 'maintenance' && <MaintenanceSection />}
            {active === 'profile'     && <ProfileSection />}
            {active === 'password'    && <PasswordSection />}
          </SectionCard>
        </div>

      </div>
    </div>
  );
};

export default AdminSettingsPage;
