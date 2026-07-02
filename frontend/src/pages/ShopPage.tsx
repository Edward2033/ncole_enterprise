import React, { useMemo, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Grid2x2, List, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts, useCollections } from '@/hooks/useProducts';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';

type Sort = 'default' | 'price-asc' | 'price-desc' | 'name';
type Layout = 'grid' | 'list';

const PAGE_SIZE = 16;

// ─── Price range presets ──────────────────────────────────────────────────────
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under RWF 5,000', min: 0, max: 5000 },
  { label: 'RWF 5,000 – 20,000', min: 5000, max: 20000 },
  { label: 'RWF 20,000 – 50,000', min: 20000, max: 50000 },
  { label: 'RWF 50,000 – 100,000', min: 50000, max: 100000 },
  { label: 'Over RWF 100,000', min: 100000, max: Infinity },
];

// ─── List product card ────────────────────────────────────────────────────────
const ListCard: React.FC<{ product: Product }> = ({ product }) => {
  const image = product.images?.[0];
  const price = product.has_variants && product.variants?.length
    ? Math.min(...product.variants.map(v => v.price))
    : product.price;
  return (
    <Link to={`/products/${product.handle}`}
      className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        {image
          ? <img src={image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          : <div className="flex h-full w-full items-center justify-center text-slate-300 text-xs">No image</div>}
      </div>
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          {product.vendor && <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">{product.vendor}</span>}
          <h3 className="mt-0.5 font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{product.description}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">{formatPrice(price)}</span>
          {product.inventory_qty !== null && product.inventory_qty <= 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ─── Main Shop Page ───────────────────────────────────────────────────────────
const ShopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';

  const { products, loading } = useProducts();
  const collections = useCollections();

  const [sort, setSort] = useState<Sort>('default');
  const [layout, setLayout] = useState<Layout>('grid');
  const [priceIdx, setPriceIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const getPrice = useCallback((p: Product) =>
    p.has_variants && p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : p.price,
  []);

  const filtered = useMemo(() => {
    let list = products;
    const range = PRICE_RANGES[priceIdx];

    // Search filter
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(q.toLowerCase()),
      );
    }

    // Price filter
    list = list.filter(p => {
      const price = getPrice(p);
      return price >= range.min && price <= range.max;
    });

    // Sort
    const copy = [...list];
    if (sort === 'price-asc') copy.sort((a, b) => getPrice(a) - getPrice(b));
    if (sort === 'price-desc') copy.sort((a, b) => getPrice(b) - getPrice(a));
    if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));

    return copy;
  }, [products, sort, q, priceIdx, getPrice]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePriceChange = (idx: number) => { setPriceIdx(idx); setPage(1); };
  const handleSort = (s: Sort) => { setSort(s); setPage(1); };
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value;
    navigate(val.trim() ? `/shop?q=${encodeURIComponent(val.trim())}` : '/shop');
    setPage(1);
  };

  const clearAll = () => { navigate('/shop'); setPriceIdx(0); setSort('default'); setPage(1); };
  const hasFilters = q || priceIdx !== 0 || sort !== 'default';

  // Skeleton
  const SkeletonGrid = () => (
    <div className={`grid gap-3 sm:gap-5 ${layout === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className={`animate-pulse bg-slate-100 ${layout === 'grid' ? 'aspect-square' : 'h-24 w-24'}`} />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{q ? `Search: "${q}"` : 'All Products'}</h1>
          <p className="mt-1 text-slate-500">{loading ? '…' : filtered.length} products {hasFilters ? 'matching your filters' : 'available'}</p>
        </div>
        {/* Mobile filter toggle */}
        <button onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-400 lg:hidden transition">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className={`flex gap-6 lg:gap-8 ${showFilters ? 'flex-col lg:flex-row' : 'flex-row'}`}>
        {/* Sidebar filters */}
        <aside className={`space-y-4 flex-shrink-0 ${
          showFilters ? 'block w-full lg:w-56' : 'hidden lg:block lg:w-56'
        }`}>
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <input name="q" defaultValue={q} placeholder="Search products…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 pr-8" />
            {q && (
              <button type="button" onClick={() => { navigate('/shop'); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Categories */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Categories
            </h3>
            <ul className="space-y-0.5">
              <li>
                <Link to="/shop"
                  onClick={() => setPage(1)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-orange-600 bg-orange-50 transition">
                  All Products
                  <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">{products.length}</span>
                </Link>
              </li>
              {collections.map(c => (
                <li key={c.id}>
                  <Link to={`/shop/category/${c.handle}`}
                    onClick={() => setPage(1)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price filter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Price Range</h3>
            <ul className="space-y-0.5">
              {PRICE_RANGES.map((range, i) => (
                <li key={range.label}>
                  <button onClick={() => handlePriceChange(i)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      priceIdx === i
                        ? 'bg-orange-50 text-orange-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                    }`}>
                    {range.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearAll}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
              <X className="h-3.5 w-3.5" /> Clear All Filters
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setLayout('grid')} aria-label="Grid view"
                className={`rounded-lg p-1.5 transition ${layout === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button onClick={() => setLayout('list')} aria-label="List view"
                className={`rounded-lg p-1.5 transition ${layout === 'list' ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <List className="h-5 w-5" />
              </button>
              {hasFilters && (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                  Filters active
                </span>
              )}
            </div>
            <select value={sort} onChange={e => handleSort(e.target.value as Sort)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20">
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>

          {/* Product display */}
          {loading ? (
            <SkeletonGrid />
          ) : paginated.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
              <SlidersHorizontal className="mx-auto h-10 w-10 text-slate-200" />
              <h3 className="mt-4 font-semibold text-slate-700">No products found</h3>
              <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search query.</p>
              <button onClick={clearAll}
                className="mt-5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
                Clear Filters
              </button>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-3">
              {paginated.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map(p => <ListCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 transition">
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === 'ellipsis' ? (
                    <span key={`e${i}`} className="px-1 text-slate-400">…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n as number)}
                      className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
                        safePage === n
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                          : 'border border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'
                      }`}>
                      {n}
                    </button>
                  ),
                )}

              <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 transition">
                Next
              </button>
            </div>
          )}

          {/* Page info */}
          {!loading && filtered.length > 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
