import React, { useEffect, useState } from 'react';
import { Settings, Save, Globe, Mail, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { adminSiteSettingsApi, type SiteSettings } from '@/services/adminApi';

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

const EMPTY: SiteSettings = {
  siteName: '', supportEmail: '', contactEmail: '',
  whatsappNumber: '', phoneNumber: '',
  githubUrl: '', linkedinUrl: '', facebookUrl: '', twitterUrl: '',
  footerText: '', address: '',
};

const AdminSiteSettingsPage: React.FC = () => {
  const [form, setForm] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    adminSiteSettingsApi.get()
      .then(r => setForm(r.data))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof SiteSettings, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false); setSaving(true);
    try {
      const res = await adminSiteSettingsApi.update(form);
      setForm(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Settings className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h1>
          <p className="text-sm text-slate-500">Global site identity — footer, contact, social links</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" /> Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Section icon={<Mail className="h-4 w-4" />} title="Contact Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site Name">
              <input className={inputCls} value={form.siteName} onChange={e => set('siteName', e.target.value)} placeholder="Ncole Interpress" />
            </Field>
            <Field label="Support Email">
              <input className={inputCls} type="email" value={form.supportEmail} onChange={e => set('supportEmail', e.target.value)} placeholder="support@ncoleinterpress.com" />
            </Field>
            <Field label="Contact Email">
              <input className={inputCls} type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="hello@ncoleinterpress.com" />
            </Field>
            <Field label="Phone Number">
              <input className={inputCls} value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+250794890144" />
            </Field>
            <Field label="WhatsApp Number" hint="Used for the floating WhatsApp button">
              <input className={inputCls} value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="+250794890144" />
            </Field>
          </div>
        </Section>

        <Section icon={<Globe className="h-4 w-4" />} title="Social Links">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="GitHub URL">
              <input className={inputCls} value={form.githubUrl ?? ''} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/Edward2033" />
            </Field>
            <Field label="LinkedIn URL">
              <input className={inputCls} value={form.linkedinUrl ?? ''} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Facebook URL">
              <input className={inputCls} value={form.facebookUrl ?? ''} onChange={e => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/edwardycole" />
            </Field>
            <Field label="Twitter / X URL">
              <input className={inputCls} value={form.twitterUrl ?? ''} onChange={e => set('twitterUrl', e.target.value)} placeholder="https://twitter.com/..." />
            </Field>
          </div>
        </Section>

        <Section icon={<MapPin className="h-4 w-4" />} title="Footer Settings">
          <Field label="Footer Tagline">
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.footerText ?? ''} onChange={e => set('footerText', e.target.value)} placeholder="Rwanda's premier multi-vendor marketplace..." />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="KG 8 Ave, Kigali, Rwanda" />
          </Field>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSiteSettingsPage;
