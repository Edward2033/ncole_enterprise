import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categoriesService, productsService } from '@/services/api';
import ProductGrid from '@/components/ProductGrid';
import type { Collection, Product } from '@/lib/types';
import type { NcoleProduct, NcoleCategory } from '@/services/api';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

function toCollection(c: NcoleCategory): Collection {
  return { id: c.id, title: c.name, handle: c.slug, description: c.description ?? null, image_url: c.imageUrl ?? null };
}

function toProduct(p: NcoleProduct): Product {
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
      id: v.id, product_id: p.id, title: v.title, sku: v.sku ?? null,
      price: v.price, inventory_qty: v.stockQty,
      option1: v.option1 ?? null, option2: v.option2 ?? null, option3: v.option3 ?? null,
      image_url: v.imageUrl ?? null, position: null,
    })),
  };
}

const CollectionPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('featured');

  useEffect(() => {
    if (!handle) return;
    let active = true;
    setLoading(true);

    categoriesService.list()
      .then(res => {
        if (!active) return;
        const cat = res.data.find(c => c.slug === handle);
        if (!cat) { setCollection(null); setLoading(false); return; }
        setCollection(toCollection(cat));
        return productsService.list(1, 100)
          .then(pr => {
            if (!active) return;
            const filtered = pr.data.filter(p => p.categoryId === cat.id);
            setProducts(filtered.map(toProduct));
          });
      })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [handle]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    const minPrice = (p: Product) =>
      p.has_variants && p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : p.price;
    switch (sort) {
      case 'price-asc': return copy.sort((a, b) => minPrice(a) - minPrice(b));
      case 'price-desc': return copy.sort((a, b) => minPrice(b) - minPrice(a));
      case 'name': return copy.sort((a, b) => a.name.localeCompare(b.name));
      default: return copy;
    }
  }, [products, sort]);

  if (!loading && !collection) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate-500">Collection not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12">
        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          {collection?.title || 'Loading...'}
        </h1>
        {collection?.description && (
          <p className="mt-3 max-w-2xl text-slate-300">{collection.description}</p>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">{sortedProducts.length} products</p>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-orange-400"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      <ProductGrid products={sortedProducts} loading={loading} />
    </div>
  );
};

export default CollectionPage;
