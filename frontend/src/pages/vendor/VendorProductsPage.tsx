import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, X, Package, Search, AlertTriangle } from 'lucide-react';
import {
  vendorProductsService, vendorProfileService, categoriesService,
  type NcoleVendorProduct, type NcoleCategory,
} from '@/services/api';
import { PButton, PInput, PTextarea, PSelect, PCard, PBadge, Spinner } from '@/components/ui/portal-ui';
import { PRODUCT_STATUS_COLOR, formatRWF, type ProductStatus } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  description: z.string().optional(),
  basePrice: z.coerce.number().int().positive(),
  stockQty: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
  categoryId: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const STATUS_FILTERS: Array<ProductStatus | 'ALL'> = ['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'];

const VendorProductsPage: React.FC = () => {
  const [items, setItems] = useState<NcoleVendorProduct[]>([]);
  const [categories, setCategories] = useState<NcoleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NcoleVendorProduct | null>(null);
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

  const openEdit = (p: NcoleVendorProduct) => {
    setEditing(p); setShowForm(true);
    setValue('name', p.name); setValue('slug', p.slug);
    setValue('description', p.description ?? ''); setValue('basePrice', p.basePrice);
    setValue('stockQty', p.stockQty); setValue('status', p.status as ProductForm['status']);
    setValue('categoryId', p.categoryId ?? '');
  };

  const onSubmit = async (data: ProductForm) => {
    setApiError(null);
    try {
      if (editing) await vendorProductsService.update(editing.id, data);
      else await vendorProductsService.create(data);
      reset(); setShowForm(false); setEditing(null); load();
    } catch (e) {
      setApiError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    await vendorProductsService.remove(id).catch(() => null);
    setDelConfirm(null); load();
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
          <PButton size="sm" onClick={() => { setEditing(null); reset(); setShowForm(true); }}>
            <Plus className="h-4 w-4" />Add Product
          </PButton>
        )}
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">{lowStockCount} product{lowStockCount > 1 ? 's' : ''} with low stock (≤5 units)</p>
        </div>
      )}

      {showForm && (
        <PCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">{editing ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); reset(); }} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
          </div>
          {apiError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{apiError}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PInput label="Product Name *" {...register('name')} error={errors.name?.message} className="sm:col-span-2" />
            <PInput label="Slug *" {...register('slug')} error={errors.slug?.message} placeholder="my-product-name" />
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
            <PTextarea label="Description" {...register('description')} className="sm:col-span-2" rows={3} />
            <div className="flex gap-3 sm:col-span-2">
              <PButton type="submit" size="sm" loading={isSubmitting}>Save Product</PButton>
              <PButton type="button" variant="secondary" size="sm" onClick={() => { setShowForm(false); setEditing(null); reset(); }}>Cancel</PButton>
            </div>
          </form>
        </PCard>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
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
                <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {search || statusFilter !== 'ALL' ? 'No matching products' : 'No products yet'}
                </td></tr>
              ) : visible.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-3 py-2 w-12">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-100" />
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

      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDelConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
            <h3 className="font-semibold dark:text-white mb-2">Delete Product</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Delete "{delConfirm.name}"? This cannot be undone.</p>
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
