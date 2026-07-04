import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, X, Package, Search, AlertTriangle, Upload, ImagePlus, Loader2 } from 'lucide-react';
import {
  vendorProductsService, vendorProfileService, categoriesService, apiFetch,
  type NcoleVendorProduct, type NcoleCategory,
} from '@/services/api';
import { PButton, PInput, PTextarea, PSelect, PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { PRODUCT_STATUS_COLOR, formatRWF, type ProductStatus } from '@/lib/utils';

const productSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  slug:        z.string().min(1).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  description: z.string().optional(),
  basePrice:   z.coerce.number().int().positive('Price must be positive'),
  stockQty:    z.coerce.number().int().min(0).default(0),
  sku:         z.string().optional(),
  tags:        z.string().optional(), // comma-separated, split before submit
  status:      z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
  categoryId:  z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const STATUS_FILTERS: Array<ProductStatus | 'ALL'> = ['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'];

// ─── Image uploader sub-component ────────────────────────────────────────────
const ImageUploader: React.FC<{
  images: string[];
  onChange: (urls: string[]) => void;
}> = ({ images, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true); setUploadError('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        const json = await apiFetch<{ data: { url: string } }>('/products/upload-image', { method: 'POST', body: fd });
        uploaded.push(json.data.url);
      }
      onChange([...images, ...uploaded]);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="sm:col-span-2 space-y-2">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
        Product Images
      </label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url + i} className="relative group">
              <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white font-semibold">Main</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 transition disabled:opacity-50 w-full justify-center"
      >
        {uploading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          : <><ImagePlus className="h-4 w-4" /> {images.length === 0 ? 'Upload product images' : 'Add more images'}</>
        }
      </button>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      <p className="text-[11px] text-slate-400">First image will be used as the main product photo. You can upload multiple.</p>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const VendorProductsPage: React.FC = () => {
  const [items, setItems] = useState<NcoleVendorProduct[]>([]);
  const [categories, setCategories] = useState<NcoleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NcoleVendorProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [delConfirm, setDelConfirm] = useState<NcoleVendorProduct | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { status: 'DRAFT', stockQty: 0 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await vendorProfileService.getMyProfile();
      const [pRes, cRes] = await Promise.all([
        vendorProductsService.list(1, 50, profile.data.id),
        categoriesService.list(),
      ]);
      setItems(pRes.data);
      setCategories(cRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'DRAFT', stockQty: 0 });
    setImages([]);
    setApiError(null);
    setShowForm(true);
  };

  const openEdit = (p: NcoleVendorProduct) => {
    setEditing(p);
    setValue('name', p.name);
    setValue('slug', p.slug);
    setValue('description', p.description ?? '');
    setValue('basePrice', p.basePrice);
    setValue('stockQty', p.stockQty);
    setValue('sku', p.sku ?? '');
    setValue('tags', (p.tags ?? []).join(', '));
    setValue('status', p.status as ProductForm['status']);
    setValue('categoryId', p.categoryId ?? '');
    setImages(p.images ?? []);
    setApiError(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); reset(); setImages([]); setApiError(null); };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) {
      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setValue('slug', slug);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setApiError(null);
    const payload = {
      ...data,
      images,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      categoryId: data.categoryId || undefined,
      sku: data.sku || undefined,
    };
    try {
      if (editing) await vendorProductsService.update(editing.id, payload);
      else         await vendorProductsService.create(payload);
      closeForm();
      load();
    } catch (e) {
      setApiError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    await vendorProductsService.remove(id).catch(() => null);
    setDelConfirm(null);
    load();
  };

  const visible = items
    .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  const lowStockCount = items.filter(p => p.stockQty <= 5 && p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{items.length} total products</p>
        </div>
        {!showForm && (
          <PButton size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Product
          </PButton>
        )}
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
            {lowStockCount} product{lowStockCount > 1 ? 's' : ''} with low stock (≤5 units)
          </p>
        </div>
      )}

      {/* ── Product Form ── */}
      {showForm && (
        <PCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">{editing ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={closeForm} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {apiError && (
            <p className="mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600">{apiError}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Image uploader — full width, first */}
            <ImageUploader images={images} onChange={setImages} />

            {/* Name — auto-generates slug */}
            <div className="sm:col-span-2">
              <PInput
                label="Product Name *"
                {...register('name')}
                error={errors.name?.message}
                onChange={e => { register('name').onChange(e); handleNameChange(e); }}
              />
            </div>

            <PInput label="Slug *" {...register('slug')} error={errors.slug?.message} placeholder="my-product-name" />
            <PInput label="SKU" {...register('sku')} placeholder="e.g. PROD-001" />
            <PInput label="Base Price (RWF) *" type="number" {...register('basePrice')} error={errors.basePrice?.message} />
            <PInput label="Stock Quantity" type="number" {...register('stockQty')} />

            <PSelect label="Status" {...register('status')}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </PSelect>

            <PSelect label="Category" {...register('categoryId')}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </PSelect>

            <div className="sm:col-span-2">
              <PInput
                label="Tags (comma-separated)"
                {...register('tags')}
                placeholder="e.g. featured, new-arrival, electronics"
              />
            </div>

            <PTextarea label="Description" {...register('description')} className="sm:col-span-2" rows={3} />

            <div className="flex gap-3 sm:col-span-2 pt-1">
              <PButton type="submit" size="sm" loading={isSubmitting}>
                <Upload className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Product'}
              </PButton>
              <PButton type="button" variant="secondary" size="sm" onClick={closeForm}>Cancel</PButton>
            </div>
          </form>
        </PCard>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === f ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex justify-center pt-8"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {['', 'Product', 'Price', 'Stock', 'Status', 'Category', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {search || statusFilter !== 'ALL' ? 'No matching products' : 'No products yet — click "Add Product" to get started'}
                </td></tr>
              ) : visible.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-3 py-2 w-12">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-100 dark:border-slate-700" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Package className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku ?? p.slug}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold dark:text-white">{formatRWF(p.basePrice)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stockQty <= 5 ? 'text-red-600 font-semibold' : 'dark:text-white'}>{p.stockQty}</span>
                    {p.stockQty <= 5 && p.status === 'ACTIVE' && <span className="ml-1 text-[10px] text-red-500">LOW</span>}
                  </td>
                  <td className="px-4 py-3"><PBadge className={PRODUCT_STATUS_COLOR[p.status as ProductStatus]}>{p.status}</PBadge></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <PButton size="sm" variant="secondary" onClick={() => openEdit(p)}><Edit2 className="h-3 w-3" /></PButton>
                      <PButton size="sm" variant="danger" onClick={() => setDelConfirm(p)}><Trash2 className="h-3 w-3" /></PButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDelConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
            <h3 className="font-semibold dark:text-white mb-2">Delete Product</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Delete "{delConfirm.name}"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <PButton variant="danger" size="sm" onClick={() => handleDelete(delConfirm.id)}>Delete</PButton>
              <PButton variant="secondary" size="sm" onClick={() => setDelConfirm(null)}>Cancel</PButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProductsPage;
