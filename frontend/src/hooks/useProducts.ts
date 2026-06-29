import { useEffect, useState, useCallback } from 'react';
import { productsService, categoriesService, type NcoleProduct, type NcoleCategory } from '@/services/api';

// ─── Backend products ─────────────────────────────────────────────────────────

export function useApiProducts(page = 1, limit = 20) {
  const [products, setProducts] = useState<NcoleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsService.list(page, limit);
      setProducts(res.data);
      setTotal(res.meta.total);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { fetch(); }, [fetch]);
  return { products, loading, total, refetch: fetch };
}

export function useApiProduct(id: string) {
  const [product, setProduct] = useState<NcoleProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsService.get(id)
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading };
}

export function useApiCategories() {
  const [categories, setCategories] = useState<NcoleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesService.list()
      .then(res => setCategories(res.data.filter(c => c.isVisible)))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

// ─── Legacy shims — keep existing pages compiling ────────────────────────────
// These map old Supabase-shaped data to the existing ProductCard / ProductGrid UI
// which expects the old { name, handle, price, images, has_variants, ... } shape.

import type { Product, Collection } from '@/lib/types';

function toLegacyProduct(p: NcoleProduct): Product {
  return {
    id: p.id,
    name: p.name,
    handle: p.slug,
    description: p.description ?? null,
    price: p.basePrice,
    sku: p.sku ?? null,
    inventory_qty: p.stockQty,
    images: p.images ?? null,
    status: p.status,
    has_variants: p.hasVariants,
    vendor: p.vendor?.businessName ?? null,
    product_type: p.category?.name ?? null,
    tags: p.tags ?? null,
    metadata: null,
    variants: p.variants?.map(v => ({
      id: v.id,
      product_id: p.id,
      title: v.title,
      sku: v.sku ?? null,
      price: v.price,
      inventory_qty: v.stockQty,
      option1: v.option1 ?? null,
      option2: v.option2 ?? null,
      option3: v.option3 ?? null,
      image_url: v.imageUrl ?? null,
      position: null,
    })),
  };
}

function toLegacyCollection(c: NcoleCategory): Collection {
  return {
    id: c.id,
    title: c.name,
    handle: c.slug,
    description: c.description ?? null,
    image_url: c.imageUrl ?? null,
  };
}

export function useProducts(_filters?: { tag?: string; type?: string }) {
  const { products: raw, loading } = useApiProducts(1, 40);
  const products = raw.map(toLegacyProduct);
  return { products, loading };
}

export function useCollections(): Collection[] {
  const { categories } = useApiCategories();
  return categories.map(toLegacyCollection);
}
