import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Package, Plus, Trash2, Archive, ToggleLeft, RefreshCw,
  Eye, Pencil, X, ImagePlus, AlertCircle,
} from 'lucide-react';
import {
  adminProductsApi, adminCategoriesApi, adminVendorsApi,
  type AdminProduct, type AdminCategory, type AdminVendor,
  type ApiMeta, type CreateProductBody,
} from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { productStatusBadge } from '@/components/admin/AdminBadge';
import { fmtRWF, fmtDate } from '@/lib/adminFormat';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Form shape ───────────────────────────────────────────────────────────────
interface ProductForm {
  name: string; slug: string; description: string;
  basePrice: string; sku: string; stockQty: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  vendorId: string; categoryId: string;
  tags: string;
  /** newline-separated image URLs typed by hand */
  imageUrls: string;
  /** local File objects picked from disk — uploaded to Cloudinary */
  imageFiles: File[];
  /** preview URLs for imageFiles (object URLs) */
  imagePreviews: string[];
}

const EMPTY_FORM: ProductForm = {
  name: '', slug: '', description: '', basePrice: '', sku: '', stockQty: '0',
  status: 'ACTIVE', vendorId: '', categoryId: '', tags: '',
  imageUrls: '', imageFiles: [], imagePreviews: [],
};

// ─── Field component ─────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition';

// ─── Image upload helper ──────────────────────────────────────────────────────
// ─── Image upload helper ────────────────────────────────────────────────────────────────────────────
// ─── Image upload helper ────────────────────────────────────────────────────────────────────────────
/**
 * Upload a File via POST /products/upload-image.
 * Uses getTokens() + doRefresh() from api.ts so the token is always
 * current. On a 401 it refreshes once then retries — same behaviour
 * as every other apiFetch call in the app.
 * NOTE: Do NOT set Content-Type — the browser sets multipart/form-data
 *       with the correct boundary automatically when body is FormData.
 */
async function uploadToCloudinary(file: File): Promise<string> {
  const BASE = ((import.meta as any)?.env?.VITE_API_URL as string) ?? 'http://localhost:4000/api/v1';

  // Import token helpers — these are the same functions used by apiFetch
  const { getTokens, doRefresh } = await import('@/services/api');

  const doUpload = async (token: string | null) => {
    const fd = new FormData();
    fd.append('image', file);
    const headers: HeadersInit = token ? { Authorization: 'Bearer ' + token } : {};
    return fetch(BASE + '/products/upload-image', { method: 'POST', headers, body: fd });
  };

  let res = await doUpload(getTokens().accessToken);

  // Token expired — refresh once then retry
  if (res.status === 401) {
    const fresh = await doRefresh();
    if (!fresh) throw new Error('Session expired. Please sign in again.');
    res = await doUpload(fresh);
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errJson.error ?? ('Upload failed (HTTP ' + res.status + ')'));
  }

  const json = await res.json() as { data?: { url?: string }; url?: string };
  const url = json?.data?.url ?? json?.url;
  if (!url) throw new Error('Cloudinary upload succeeded but returned no URL');
  return url;
}

// ─── ProductFormModal ─────────────────────────────────────────────────────────
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: AdminProduct | null; // null = create mode
  categories: AdminCategory[];
  vendors: AdminVendor[];
}

const ProductFormModal: React.FC<FormModalProps> = ({
  open, onClose, onSaved, product, categories, vendors,
}) => {
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        basePrice: String(product.basePrice),
        sku: product.sku ?? '',
        stockQty: String(product.stockQty),
        status: product.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
        vendorId: product.vendorId,
        categoryId: product.categoryId ?? '',
        tags: product.tags?.join(', ') ?? '',
        imageUrls: product.images?.join('\n') ?? '',
        imageFiles: [],
        imagePreviews: [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSaveError('');
  }, [open, product]);

  const set = (key: keyof ProductForm, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      // auto-slug only when slug hasn't been manually edited or matches previous auto-slug
      slug: f.slug === '' || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
  };

  // Pick image files from disk
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    setForm(f => ({
      ...f,
      imageFiles: [...f.imageFiles, ...files],
      imagePreviews: [...f.imagePreviews, ...previews],
    }));
    // reset input so same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFileImage = (idx: number) => {
    setForm(f => {
      URL.revokeObjectURL(f.imagePreviews[idx]);
      return {
        ...f,
        imageFiles: f.imageFiles.filter((_, i) => i !== idx),
        imagePreviews: f.imagePreviews.filter((_, i) => i !== idx),
      };
    });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    if (!form.name.trim())              e.name      = 'Product name is required';
    if (!form.slug.trim())              e.slug      = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug    = 'Slug: lowercase letters, numbers and hyphens only';
    if (!form.vendorId)                 e.vendorId  = 'Vendor is required';
    const price = Number(form.basePrice);
    if (!form.basePrice || isNaN(price) || price <= 0) e.basePrice = 'Price must be a positive integer';
    if (!Number.isInteger(price))       e.basePrice = 'Price must be a whole number (RWF)';
    const qty = Number(form.stockQty);
    if (isNaN(qty) || qty < 0)         e.stockQty  = 'Stock quantity must be 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!validate()) return;
    setSaving(true);

    try {
      // 1. Upload any picked files to Cloudinary (or get object URLs in dev)
      let uploadedUrls: string[] = [];
      if (form.imageFiles.length > 0) {
        setUploadingImages(true);
        uploadedUrls = await Promise.all(form.imageFiles.map(uploadToCloudinary));
        setUploadingImages(false);
      }

      // 2. Merge hand-typed URLs with uploaded URLs
      // Reject blob: URLs — they are temporary browser-memory object URLs that
      // die when the tab closes and cannot be served to any other client.
      const typedUrls = form.imageUrls
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(url => {
          if (url.startsWith('blob:')) {
            setSaveError('One or more image URLs are temporary browser URLs (blob:). Please upload the image file using the "Upload images from device" button instead.');
            return false;
          }
          return true;
        });
      if (form.imageUrls.trim() && typedUrls.length === 0 && form.imageUrls.split('\n').some(s => s.trim().startsWith('blob:'))) {
        setSaving(false);
        return;
      }
      const allImages = [...typedUrls, ...uploadedUrls];

      // 3. Build payload — match backend createProductSchema / updateProductSchema
      const payload: CreateProductBody = {
        name:        form.name.trim(),
        slug:        form.slug.trim(),
        vendorId:    form.vendorId,
        categoryId:  form.categoryId || undefined,
        description: form.description.trim() || undefined,
        basePrice:   Math.round(Number(form.basePrice)),
        sku:         form.sku.trim() || undefined,
        stockQty:    Math.round(Number(form.stockQty)),
        images:      allImages,
        tags:        form.tags.split(',').map(s => s.trim()).filter(Boolean),
        status:      form.status,
      };

      if (isEdit && product) {
        await adminProductsApi.update(product.id, payload as Record<string, unknown>);
      } else {
        await adminProductsApi.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setSaveError((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit: ${product?.name}` : 'Add New Product'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {saveError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Product Name" required error={errors.name}>
            <input
              className={inputCls} value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Premium Wireless Headphones"
            />
          </Field>

          <Field label="Slug" required error={errors.slug}>
            <input
              className={`${inputCls} font-mono`} value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="e.g. premium-wireless-headphones"
            />
          </Field>

          <Field label="Vendor" required error={errors.vendorId}>
            <select className={inputCls} value={form.vendorId} onChange={e => set('vendorId', e.target.value)}>
              <option value="">Select vendor…</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.businessName}</option>)}
            </select>
          </Field>

          <Field label="Category">
            <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Base Price (RWF)" required error={errors.basePrice}>
            <input
              className={inputCls} type="number" min="1" step="1"
              value={form.basePrice} onChange={e => set('basePrice', e.target.value)}
              placeholder="e.g. 25000"
            />
          </Field>

          <Field label="Stock Quantity" error={errors.stockQty}>
            <input
              className={inputCls} type="number" min="0" step="1"
              value={form.stockQty} onChange={e => set('stockQty', e.target.value)}
            />
          </Field>

          <Field label="SKU">
            <input
              className={`${inputCls} font-mono`} value={form.sku}
              onChange={e => set('sku', e.target.value)}
              placeholder="e.g. SKU-001"
            />
          </Field>

          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED')}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className={`${inputCls} resize-none`} rows={3}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Product description…"
          />
        </Field>

        <Field label="Tags (comma-separated)">
          <input
            className={inputCls} value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g. electronics, wireless, audio"
          />
        </Field>

        {/* Image section */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ImagePlus className="h-4 w-4" /> Product Images
          </p>

          {/* File picker */}
          <div>
            <input
              ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple className="hidden"
              onChange={handleFilePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 hover:border-orange-400 hover:text-orange-500 transition"
            >
              <ImagePlus className="h-4 w-4" />
              Upload images from device
            </button>
          </div>

          {/* File previews */}
          {form.imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.imagePreviews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                  <button
                    type="button" onClick={() => removeFileImage(i)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Manual URL entry */}
          <Field label="Image URLs (one per line)">
            <textarea
              className={`${inputCls} resize-none font-mono text-xs`} rows={3}
              value={form.imageUrls} onChange={e => set('imageUrls', e.target.value)}
              placeholder="https://res.cloudinary.com/…/image.jpg&#10;https://cdn.example.com/image.png"
            />
          </Field>

          {/* Preview hand-typed URLs */}
          {form.imageUrls.trim() && (
            <div className="flex flex-wrap gap-2">
              {form.imageUrls.split('\n').map(s => s.trim()).filter(Boolean).map((url, i) => (
                <img
                  key={i} src={url} alt=""
                  className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {(saving || uploadingImages) && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {uploadingImages ? 'Uploading images…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button
            type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminProductsPage: React.FC = () => {
  const [products,   setProducts]   = useState<AdminProduct[]>([]);
  const [meta,       setMeta]       = useState<ApiMeta | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [vendors,    setVendors]    = useState<AdminVendor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [searchDraft,setSearchDraft]= useState('');
  const [status,     setStatus]     = useState<string>('ALL');
  const [catFilter,  setCatFilter]  = useState('');
  const [vendorFilter,setVendorFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);
  const [delConfirm,  setDelConfirm]  = useState<AdminProduct | null>(null);
  const [acting,      setActing]      = useState(false);

  const load = useCallback(async (p = page, q = search, s = status, c = catFilter, v = vendorFilter) => {
    setLoading(true); setError(null);
    try {
      const res = await adminProductsApi.list({
        page: p, limit: 20,
        q: q || undefined,
        status: s,            // always send; backend treats 'ALL' as no filter
        categoryId: c || undefined,
        vendorId: v || undefined,
      });
      setProducts(res.data);
      setMeta(res.meta);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, search, status, catFilter, vendorFilter]);

  useEffect(() => { load(page, search, status, catFilter, vendorFilter); }, [page, status, catFilter, vendorFilter]);

  useEffect(() => {
    adminCategoriesApi.list().then(r => setCategories(r.data)).catch(() => null);
    adminVendorsApi.list().then(r => setVendors(r.data)).catch(() => null);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchDraft);
    setPage(1);
    load(1, searchDraft, status, catFilter, vendorFilter);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSearch('');
    setPage(1);
    load(1, '', status, catFilter, vendorFilter);
  };

  const handleToggleStatus = async (p: AdminProduct) => {
    setActing(true);
    try {
      const next = p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await adminProductsApi.update(p.id, { status: next });

      // Always refetch with ALL statuses to guarantee the updated row is visible.
      // This prevents the common “it didn’t change” illusion caused by active filters.
      await load(1, '', 'ALL', '', '');
      setPage(1);
      setSearch('');
      setStatus('ALL');
      setCatFilter('');
      setVendorFilter('');
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); }
  };

  const handleDelete = async () => {
    if (!delConfirm) return;
    setActing(true);
    try {
      await adminProductsApi.delete(delConfirm.id);
      setDelConfirm(null);
      // If last item on a page > 1, go back a page
      const targetPage = products.length === 1 && page > 1 ? page - 1 : page;
      await load(targetPage, search, status, catFilter, vendorFilter);
      if (targetPage !== page) setPage(targetPage);
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); }
  };

  const statsData = {
    total:    meta?.total ?? products.length,
    active:   products.filter(p => p.status === 'ACTIVE').length,
    draft:    products.filter(p => p.status === 'DRAFT').length,
    lowStock: products.filter(p => p.stockQty <= 5).length,
  };

  const columns: Column<AdminProduct>[] = [
    {
      key: 'product', header: 'Product',
      render: p => (
        <div className="flex items-center gap-3 min-w-0">
          {p.images?.[0]
            ? <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
            : <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-slate-400" /></div>
          }
          <div className="min-w-0">
            <button onClick={() => setViewProduct(p)} className="font-medium text-orange-600 hover:underline truncate text-left block max-w-[160px]">{p.name}</button>
            {p.sku && <p className="text-xs text-slate-400 font-mono">SKU: {p.sku}</p>}
          </div>
        </div>
      ),
    },
    { key: 'cat',    header: 'Category', render: p => <span className="text-xs text-slate-500">{p.category?.name ?? '—'}</span> },
    { key: 'vendor', header: 'Vendor',   render: p => <span className="text-xs text-slate-500 truncate max-w-[100px] block">{p.vendor?.businessName ?? '—'}</span> },
    { key: 'price',  header: 'Price',    render: p => <span className="font-semibold dark:text-white">{fmtRWF(p.basePrice)}</span> },
    {
      key: 'stock', header: 'Stock',
      render: p => (
        <span className={`font-semibold text-sm ${p.stockQty === 0 ? 'text-red-600' : p.stockQty <= 5 ? 'text-amber-600' : 'dark:text-white'}`}>
          {p.stockQty === 0 ? '⚠ Out' : p.stockQty}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: p => productStatusBadge(p.status) },
    { key: 'added',  header: 'Added',  render: p => <span className="text-xs text-slate-500">{fmtDate(p.createdAt)}</span> },
    {
      key: 'actions', header: '', width: '110px',
      render: p => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewProduct(p)} title="View" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => setEditProduct(p)} title="Edit" className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(p)} title={p.status === 'ACTIVE' ? 'Archive' : 'Activate'}
            disabled={acting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-40"
          >
            {p.status === 'ACTIVE' ? <Archive className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button onClick={() => setDelConfirm(p)} title="Delete" className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
            <p className="text-sm text-slate-500">{meta?.total ?? '—'} total products in catalogue</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(page, search, status, catFilter, vendorFilter)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total',         value: statsData.total,    color: 'text-slate-900 dark:text-white',   bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Active',        value: statsData.active,   color: 'text-green-700',                   bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Draft',         value: statsData.draft,    color: 'text-yellow-700',                  bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
          { label: 'Low Stock (≤5)',value: statsData.lowStock, color: 'text-red-700',                     bg: 'bg-red-100 dark:bg-red-900/30' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${s.bg}`}>
              <Package className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <AdminSearch value={searchDraft} onChange={v => { setSearchDraft(v); if (!v) handleClearSearch(); }} placeholder="Search products…" className="flex-1" />
          <button type="submit" className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">Go</button>
        </form>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
        </select>
        <select
          value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={vendorFilter} onChange={e => { setVendorFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.businessName}</option>)}
        </select>
        {(search || status !== 'ALL' || catFilter || vendorFilter) && (
          <button
            onClick={() => { setSearch(''); setSearchDraft(''); setStatus('ALL'); setCatFilter(''); setVendorFilter(''); setPage(1); load(1, '', 'ALL', '', ''); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <AdminTable<AdminProduct>
        columns={columns} data={products} keyFn={p => p.id}
        loading={loading} emptyText="No products found" emptyIcon={<Package />}
        page={page} totalPages={meta?.totalPages} total={meta?.total}
        onPage={p => setPage(p)}
      />

      {/* Create / Edit modal */}
      <ProductFormModal
        open={showCreate || !!editProduct}
        onClose={() => { setShowCreate(false); setEditProduct(null); }}
        onSaved={() => load(page, search, status, catFilter, vendorFilter)}
        product={editProduct}
        categories={categories}
        vendors={vendors}
      />

      {/* View detail */}
      <AdminModal open={!!viewProduct} onClose={() => setViewProduct(null)} title="Product Details" size="lg">
        {viewProduct && (
          <div className="space-y-4 text-sm">
            {viewProduct.images?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {viewProduct.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-24 w-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {([
                ['Name',        viewProduct.name],
                ['SKU',         viewProduct.sku ?? '—'],
                ['Status',      viewProduct.status],
                ['Price',       fmtRWF(viewProduct.basePrice)],
                ['Stock',       String(viewProduct.stockQty)],
                ['Category',    viewProduct.category?.name ?? '—'],
                ['Vendor',      viewProduct.vendor?.businessName ?? '—'],
                ['Added',       fmtDate(viewProduct.createdAt)],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-medium dark:text-white">{v}</p>
                </div>
              ))}
            </div>
            {viewProduct.description && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-slate-700 dark:text-slate-300">{viewProduct.description}</p>
              </div>
            )}
            {viewProduct.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewProduct.tags.map(t => (
                  <span key={t} className="rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 text-xs font-medium">{t}</span>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => { setViewProduct(null); setEditProduct(viewProduct); }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
              >
                <Pencil className="h-4 w-4" /> Edit Product
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!delConfirm} danger
        onClose={() => setDelConfirm(null)}
        onConfirm={handleDelete}
        loading={acting}
        title="Delete Product"
        message={`Permanently delete "${delConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default AdminProductsPage;
