import React from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';

const SkeletonCard: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="aspect-square animate-pulse bg-slate-100" />
    <div className="space-y-2 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-1/4 animate-pulse rounded bg-slate-100" />
    </div>
  </div>
);

const ProductGrid: React.FC<{ products: Product[]; loading?: boolean }> = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
        No products found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default ProductGrid;
