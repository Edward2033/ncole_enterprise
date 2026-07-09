import React, { useEffect, useState } from 'react';
import {
  Settings, Save, Globe, Mail, MapPin, AlertCircle, CheckCircle,
  Layout, Plus, Trash2, Image, Palette, X,
} from 'lucide-react';
import { adminSiteSettingsApi, adminSettingsApi, type SiteSettings, type HeaderSettings } from '@/services/adminApi';
import { API_BASE } from '@/config/api';

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600">{icon}</span>
      <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">{title}</h2>
    </div>
    {children}
  </div>
);

// Reusable image field with preview, upload, edit URL, and clear
const ImageField: React.FC<{
  label: string;
  hint?: string;
  value: string;
  uploading: boolean;
  previewClass?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
}> = ({ label, hint, value, uploading, previewClass = 'h-12', onChange, onUpload }) => (
  <Field label={label} hint={hint}>
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className={`${previewClass} rounded-lg border border-slate-200 object-contain bg-slate-50 p-1`} />
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className={`${previewClass} w-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300`}>
          <Image className="h-5 w-5" />
        </div>
      )}
      <input
        className={inputCls}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste image URL or upload below"
      />
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-orange-400 hover:text-orange-500 transition">
        {uploading
          ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
          : <Image className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading…' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => {
          const f = e.target.files?.[0];
          if (f) { onUpload(f); e.target.value = ''; }
        }} />
      </label>
    </div>
  </Field>
);

const EMPTY_SITE: SiteSettings = {
  siteName: '', supportEmail: '', contactEmail: '',
  whatsappNumber: '', phoneNumber: '',
  githubUrl: '', linkedinUrl: '', facebookUrl: '', twitterUrl: '',
  footerText: '', address: '',
};

const EMPTY_HEADER: HeaderSettings = {
  siteName: '', headerTitle: '', headerSubtitle: '',
  logoUrl: '', headerLogoUrl: '', faviconUrl: '',
  headerBgColor: '#ffffff', headerTextColor: '#0f172a',
  headerBgImage: '', navLinks: [],
};

const AdminSiteSettingsPage: React.FC = () => {
  const [siteForm, setSiteForm] = useState<SiteSettings>(EMPTY_SITE);
  const [headerForm, setHeaderForm] = useState<HeaderSettings>(EMPTY_HEADER);
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeaderLogo, setUploadingHeaderLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [error, setError] = useState('');
  const [successSite, setSuccessSite] = useState(false);
  const [successHeader, setSuccessHeader] = useState(false);

  useEffect(() => {
    Promise.all([
      adminSiteSettingsApi.get(),
      adminSettingsApi.getHeaderSettings(),
    ])
      .then(([siteRes, headerRes]) => {
        setSiteForm(siteRes.data);
        setHeaderForm(headerRes.data ?? EMPTY_HEADER);
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const setSite = (k: keyof SiteSettings, v: string) => setSiteForm(f => ({ ...f, [k]: v }));
  const setHeader = (k: keyof HeaderSettings, v: unknown) => setHeaderForm(f => ({ ...f, [k]: v }));

  const uploadImage = async (
    file: File,
    setUploading: (v: boolean) => void,
    onSuccess: (url: string) => void,
  ) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/products/upload-application-photo`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      onSuccess(json.data.url as string);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessSite(false); setSavingSite(true);
    try {
      const res = await adminSiteSettingsApi.update(siteForm);
      setSiteForm(res.data);
      setSuccessSite(true);
      setTimeout(() => setSuccessSite(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessHeader(false); setSavingHeader(true);
    try {
      const res = await adminSettingsApi.updateHeaderSettings(headerForm);
      setHeaderForm(res.data);
      setSuccessHeader(true);
      setTimeout(() => setSuccessHeader(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingHeader(false);
    }
  };

  const addNavLink = () =>
    setHeaderForm(f => ({ ...f, navLinks: [...(f.navLinks ?? []), { label: '', url: '' }] }));

  const updateNavLink = (i: number, field: 'label' | 'url', val: string) =>
    setHeaderForm(f => {
      const links = [...(f.navLinks ?? [])];
      links[i] = { ...links[i], [field]: val };
      return { ...f, navLinks: links };
    });

  const removeNavLink = (i: number) =>
    setHeaderForm(f => ({ ...f, navLinks: (f.navLinks ?? []).filter((_, idx) => idx !== i) }));

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Settings className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h1>
          <p className="text-sm text-slate-500">Manage header, footer, contact info, and social links</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Header Settings ─────────────────────────────────────────────── */}
      <form onSubmit={handleSaveHeader} className="space-y-6">
        {successHeader && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" /> Header settings saved successfully.
          </div>
        )}

        <Section icon={<Layout className="h-4 w-4" />} title="Header Settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site Name" hint="Displayed in browser tab and header">
              <input className={inputCls} value={headerForm.siteName ?? ''} onChange={e => setHeader('siteName', e.target.value)} placeholder="Ncole Interpress" />
            </Field>
            <Field label="Header Title">
              <input className={inputCls} value={headerForm.headerTitle ?? ''} onChange={e => setHeader('headerTitle', e.target.value)} placeholder="Ncole Interpress" />
            </Field>
            <Field label="Header Subtitle" hint="Shown below the title in the header">
              <input className={inputCls} value={headerForm.headerSubtitle ?? ''} onChange={e => setHeader('headerSubtitle', e.target.value)} placeholder="Rwanda's Premier Marketplace" />
            </Field>
          </div>
        </Section>

        <Section icon={<Image className="h-4 w-4" />} title="Logo & Favicon">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ImageField
              label="Website Logo"
              hint="Main site logo shown in the navbar"
              value={headerForm.logoUrl ?? ''}
              uploading={uploadingLogo}
              onChange={url => setHeader('logoUrl', url)}
              onUpload={f => uploadImage(f, setUploadingLogo, url => setHeader('logoUrl', url))}
            />
            <ImageField
              label="Header Logo"
              hint="Logo shown in the top header bar"
              value={headerForm.headerLogoUrl ?? ''}
              uploading={uploadingHeaderLogo}
              onChange={url => setHeader('headerLogoUrl', url)}
              onUpload={f => uploadImage(f, setUploadingHeaderLogo, url => setHeader('headerLogoUrl', url))}
            />
            <ImageField
              label="Favicon"
              hint="Browser tab icon (32×32 recommended)"
              value={headerForm.faviconUrl ?? ''}
              uploading={uploadingFavicon}
              previewClass="h-8 w-8"
              onChange={url => setHeader('faviconUrl', url)}
              onUpload={f => uploadImage(f, setUploadingFavicon, url => setHeader('faviconUrl', url))}
            />
          </div>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Header Colors & Background">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Header Background Color">
              <div className="flex items-center gap-2">
                <input type="color" value={headerForm.headerBgColor ?? '#ffffff'} onChange={e => setHeader('headerBgColor', e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
                <input className={inputCls} value={headerForm.headerBgColor ?? ''} onChange={e => setHeader('headerBgColor', e.target.value)} placeholder="#ffffff" />
              </div>
            </Field>
            <Field label="Header Text Color">
              <div className="flex items-center gap-2">
                <input type="color" value={headerForm.headerTextColor ?? '#0f172a'} onChange={e => setHeader('headerTextColor', e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
                <input className={inputCls} value={headerForm.headerTextColor ?? ''} onChange={e => setHeader('headerTextColor', e.target.value)} placeholder="#0f172a" />
              </div>
            </Field>
            <Field label="Header Background Image URL" hint="Optional — overrides background color">
              <input className={inputCls} value={headerForm.headerBgImage ?? ''} onChange={e => setHeader('headerBgImage', e.target.value)} placeholder="https://..." />
            </Field>
          </div>
        </Section>

        <Section icon={<Globe className="h-4 w-4" />} title="Navigation Menu">
          <div className="space-y-2">
            {(headerForm.navLinks ?? []).map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputCls} flex-1`} value={link.label} onChange={e => updateNavLink(i, 'label', e.target.value)} placeholder="Label (e.g. Shop)" />
                <input className={`${inputCls} flex-1`} value={link.url} onChange={e => updateNavLink(i, 'url', e.target.value)} placeholder="URL (e.g. /shop)" />
                <button type="button" onClick={() => removeNavLink(i)} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addNavLink}
              className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-orange-400 hover:text-orange-500 transition">
              <Plus className="h-4 w-4" /> Add Nav Link
            </button>
          </div>
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={savingHeader}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
            {savingHeader && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            <Save className="h-4 w-4" />
            {savingHeader ? 'Saving…' : 'Save Header Settings'}
          </button>
        </div>
      </form>

      {/* ── Site / Contact Settings ──────────────────────────────────────── */}
      <form onSubmit={handleSaveSite} className="space-y-6">
        {successSite && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" /> Site settings saved successfully.
          </div>
        )}

        <Section icon={<Mail className="h-4 w-4" />} title="Contact Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site Name">
              <input className={inputCls} value={siteForm.siteName} onChange={e => setSite('siteName', e.target.value)} placeholder="Ncole Interpress" />
            </Field>
            <Field label="Support Email">
              <input className={inputCls} type="email" value={siteForm.supportEmail} onChange={e => setSite('supportEmail', e.target.value)} placeholder="support@ncoleinterpress.com" />
            </Field>
            <Field label="Contact Email">
              <input className={inputCls} type="email" value={siteForm.contactEmail} onChange={e => setSite('contactEmail', e.target.value)} placeholder="hello@ncoleinterpress.com" />
            </Field>
            <Field label="Phone Number">
              <input className={inputCls} value={siteForm.phoneNumber} onChange={e => setSite('phoneNumber', e.target.value)} placeholder="+250794890144" />
            </Field>
            <Field label="WhatsApp Number" hint="Used for the floating WhatsApp button">
              <input className={inputCls} value={siteForm.whatsappNumber} onChange={e => setSite('whatsappNumber', e.target.value)} placeholder="+250794890144" />
            </Field>
          </div>
        </Section>

        <Section icon={<Globe className="h-4 w-4" />} title="Social Links">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="GitHub URL">
              <input className={inputCls} value={siteForm.githubUrl ?? ''} onChange={e => setSite('githubUrl', e.target.value)} placeholder="https://github.com/Edward2033" />
            </Field>
            <Field label="LinkedIn URL">
              <input className={inputCls} value={siteForm.linkedinUrl ?? ''} onChange={e => setSite('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Facebook URL">
              <input className={inputCls} value={siteForm.facebookUrl ?? ''} onChange={e => setSite('facebookUrl', e.target.value)} placeholder="https://facebook.com/edwardycole" />
            </Field>
            <Field label="Twitter / X URL">
              <input className={inputCls} value={siteForm.twitterUrl ?? ''} onChange={e => setSite('twitterUrl', e.target.value)} placeholder="https://twitter.com/..." />
            </Field>
          </div>
        </Section>

        <Section icon={<MapPin className="h-4 w-4" />} title="Footer Settings">
          <Field label="Footer Tagline">
            <textarea className={`${inputCls} resize-none`} rows={2} value={siteForm.footerText ?? ''} onChange={e => setSite('footerText', e.target.value)} placeholder="Rwanda's premier multi-vendor marketplace..." />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={siteForm.address ?? ''} onChange={e => setSite('address', e.target.value)} placeholder="KG 8 Ave, Kigali, Rwanda" />
          </Field>
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={savingSite}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
            {savingSite && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            <Save className="h-4 w-4" />
            {savingSite ? 'Saving…' : 'Save Site Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSiteSettingsPage;
