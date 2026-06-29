import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/ProductGrid';

export const SearchPage: React.FC = () => {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const { products, loading } = useProducts();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.product_type || '').toLowerCase().includes(q),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 font-serif text-3xl font-bold text-slate-900">
        Results for &ldquo;{params.get('q')}&rdquo;
      </h1>
      <ProductGrid products={filtered} loading={loading} />
    </div>
  );
};

// LoginPage kept for any legacy references — App.tsx now uses AuthPage
export const LoginPage: React.FC = () => {
  return null; // redirect handled by App.tsx route
};
