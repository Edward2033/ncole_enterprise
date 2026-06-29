import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import { useProducts, useCollections } from '@/hooks/useProducts';

const CategoryShopPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts({ type: slug });
  const collections = useCollections();
  const [sort, setSort] = useState('default');

  const category = collections.find(c => c.handle === slug);

  const sorted = useMemo(() => {
    const copy = [...products];
    const price = (p: typeof copy[0]) => p.has_variants && p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : p.price;
    if (sort === 'price-asc') copy.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') copy.sort((a, b) => price(b) - price(a));
    if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [products, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-2">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Products
        </Link>
      </div>

      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{category?.title ?? slug}</h1>
        {category?.description && <p className="mt-3 max-w-2xl text-slate-300">{category.description}</p>}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{sorted.length} products</p>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400">
          <option value="default">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      <ProductGrid products={sorted} loading={loading} />
    </div>
  );
};

export default CategoryShopPage;
