import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Upload, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { adminTestimonialsApi, type AdminTestimonial } from '@/services/adminApi';

const EMPTY: Omit<AdminTestimonial, 'id' | 'createdAt'> = {
  name: '', role: '', rating: 5, text: '', photoUrl: '', isPublished: false,
};

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
        <Star className={`h-5 w-5 transition ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} />
      </button>
    ))}
  </div>
);

const AdminTestimonialsPage: React.FC = () => {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    adminTestimonialsApi.list()
      .then(r => setItems(r.data))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setOpen(true); };
  const openEdit = (t: AdminTestimonial) => {
    setEditing(t);
    setForm({ name: t.name, role: t.role, rating: t.rating, text: t.text, photoUrl: t.photoUrl ?? '', isPublished: t.isPublished });
    setError('');
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); setError(''); };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminTestimonialsApi.uploadPhoto(file);
      setForm(f => ({ ...f, photoUrl: url }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) { setError('Name and text are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        const r = await adminTestimonialsApi.update(editing.id, form);
        setItems(prev => prev.map(t => t.id === editing.id ? r.data : t));
        flash('Testimonial updated.');
      } else {
        const r = await adminTestimonialsApi.create(form);
        setItems(prev => [...prev, r.data]);
        flash('Testimonial created.');
      }
      closeModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    try {
      await adminTestimonialsApi.remove(id);
      setItems(prev => prev.filter(t => t.id !== id));
      flash('Testimonial deleted.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleTogglePublish = async (t: AdminTestimonial) => {
    try {
      const r = await adminTestimonialsApi.update(t.id, { isPublished: !t.isPublished });
      setItems(prev => prev.map(x => x.id === t.id ? r.data : x));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Testimonials</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage community testimonials shown on the homepage</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition active:scale-95">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      {error && !open && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 py-16 text-center">
          <Star className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No testimonials yet. Add the first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(t => (
            <div key={t.id} className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {t.photoUrl ? (
                    <img src={t.photoUrl} alt={t.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-sm font-bold text-white flex-shrink-0">
                      {t.name[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.name}</p>
                    <p className="text-xs text-slate-400 truncate">{t.role}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {t.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="mt-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`h-3.5 w-3.5 ${n <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} />
                ))}
              </div>
              <p className="mt-2 flex-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-3">"{t.text}"</p>
              <div className="mt-4 flex items-center gap-1 border-t border-slate-100 dark:border-slate-700 pt-3">
                <button onClick={() => handleTogglePublish(t)} title={t.isPublished ? 'Unpublish' : 'Publish'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  {t.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(t)} title="Edit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} title="Delete"
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editing ? 'Edit Testimonial' : 'Add Testimonial'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
              {error && (
                <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              {/* Photo upload */}
              <div className="flex items-center gap-4">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover flex-shrink-0 ring-2 ring-orange-200" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex-shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
                    {uploading ? 'Uploading…' : 'Upload Photo'}
                  </button>
                  {form.photoUrl && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                      className="text-xs text-red-500 hover:underline text-left">Remove photo</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Role / Location</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Business Owner, Kigali"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Star Rating</label>
                <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Testimonial Text *</label>
                <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} required rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-orange-500" />
                <span className="text-slate-700 dark:text-slate-300">Publish immediately (visible on homepage)</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <button type="button" onClick={closeModal}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition active:scale-95">
                  {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonialsPage;
