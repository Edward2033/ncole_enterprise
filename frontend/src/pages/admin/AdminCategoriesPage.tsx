import React, { useEffect, useState, useCallback } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Sparkles } from 'lucide-react';
import { adminCategoriesApi, type AdminCategory } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';
import { useToast } from '@/hooks/use-toast';

interface CatForm {
  name: string; slug: string; description: string;
  sortOrder: string; parentId: string; isVisible: boolean;
}

const EMPTY_FORM: CatForm = {
  name: '', slug: '', description: '', sortOrder: '0', parentId: '', isVisible: true,
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition';

const AdminCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [delCat, setDelCat] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminCategoriesApi.list();
      setCategories(res.data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-generate slug from name only when creating
  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: editCat ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const openEdit = (cat: AdminCategory) => {
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description ?? '',
      sortOrder: String(cat.sortOrder), parentId: cat.parentId ?? '', isVisible: cat.isVisible,
    });
    setFormError('');
    setEditCat(cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        sortOrder: Number(form.sortOrder),
        parentId: form.parentId || undefined,
        isVisible: form.isVisible,
      };
      if (editCat) {
        await adminCategoriesApi.update(editCat.id, body);
        setEditCat(null);
        toast({ title: 'Category updated', description: `"${form.name}" saved successfully.` });
      } else {
        await adminCategoriesApi.create(body);
        setShowCreate(false);
        toast({ title: 'Category created', description: `"${form.name}" added successfully.` });
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delCat) return;
    setSaving(true);
    try {
      await adminCategoriesApi.delete(delCat.id);
      toast({ title: 'Category deleted', description: `"${delCat.name}" has been hidden.` });
      setDelCat(null);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleToggleVisibility = async (cat: AdminCategory) => {
    try {
      await adminCategoriesApi.update(cat.id, { isVisible: !cat.isVisible });
      await load();
    } catch (e) { setError((e as Error).message); }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await adminCategoriesApi.seedDefaults();
      const { created, skipped } = res.data;
      toast({
        title: 'Default categories seeded',
        description: `${created} created, ${skipped} already existed and were skipped.`,
      });
      await load();
    } catch (e) {
      toast({ title: 'Seed failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  // Flatten including children for display
  const flat: AdminCategory[] = [];
  categories.forEach(c => {
    flat.push(c);
    (c.children ?? []).forEach(ch => flat.push({ ...ch, name: `  ↳ ${ch.name}` }));
  });

  const columns: Column<AdminCategory>[] = [
    {
      key: 'name', header: 'Category',
      render: c => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white whitespace-pre">{c.name}</p>
            <p className="text-xs text-slate-500 font-mono">{c.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'desc',  header: 'Description', render: c => <span className="text-xs text-slate-500 line-clamp-1">{c.description ?? '—'}</span> },
    { key: 'sort',  header: 'Order',        render: c => <span className="text-xs text-slate-500">{c.sortOrder}</span> },
    { key: 'vis',   header: 'Visible',      render: c => <AdminBadge label={c.isVisible ? 'Visible' : 'Hidden'} color={c.isVisible ? 'green' : 'slate'} /> },
    { key: 'added', header: 'Created',      render: c => <span className="text-xs text-slate-500">{fmtDate(c.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: c => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleToggleVisibility(c)} title={c.isVisible ? 'Hide' : 'Show'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            {c.isVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
          <button onClick={() => openEdit(c)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <Pencil className="h-4 w-4"/>
          </button>
          <button onClick={() => setDelCat(c)}
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <Trash2 className="h-4 w-4"/>
          </button>
        </div>
      ),
    },
  ];

  const CategoryForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Name *</label>
          <input required value={form.name} onChange={e => handleNameChange(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Slug *</label>
          <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className={`${inputCls} font-mono`} />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} className={`${inputCls} resize-none`} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Display Order</label>
          <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
            className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Parent Category</label>
          <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
            className={inputCls}>
            <option value="">None (top-level)</option>
            {categories.filter(c => !editCat || c.id !== editCat.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="visible" checked={form.isVisible}
            onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} className="rounded" />
          <label htmlFor="visible" className="text-sm text-slate-700 dark:text-slate-300">Visible to customers</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition inline-flex items-center gap-2">
          {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {editCat ? 'Save Changes' : 'Create Category'}
        </button>
        <button type="button"
          onClick={() => { setShowCreate(false); setEditCat(null); setForm(EMPTY_FORM); setFormError(''); }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <FolderOpen className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
            <p className="text-sm text-slate-500">{flat.length} categories</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={handleSeedDefaults} disabled={seeding}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 transition">
            {seeding
              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              : <Sparkles className="h-4 w-4" />}
            Seed Defaults
          </button>
          <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setFormError(''); }}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
            <Plus className="h-4 w-4" /> New Category
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <AdminTable<AdminCategory>
        columns={columns} data={flat} keyFn={c => c.id}
        loading={loading} emptyText="No categories yet" emptyIcon={<FolderOpen />}
      />

      {/* Create */}
      <AdminModal open={showCreate} onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormError(''); }} title="New Category">
        <CategoryForm />
      </AdminModal>

      {/* Edit */}
      <AdminModal open={!!editCat} onClose={() => { setEditCat(null); setForm(EMPTY_FORM); setFormError(''); }} title="Edit Category">
        <CategoryForm />
      </AdminModal>

      {/* Delete confirmation */}
      <ConfirmModal open={!!delCat} danger onClose={() => setDelCat(null)} onConfirm={handleDelete} loading={saving}
        title="Delete Category" message={`Delete "${delCat?.name}"? This will hide it from customers.`} confirmLabel="Delete" />
    </div>
  );
};

export default AdminCategoriesPage;
