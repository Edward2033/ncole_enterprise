import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Minus, Plus, ShoppingCart, Check, Truck, ShieldCheck,
  Clock, Star, ChevronRight, Eye,
} from 'lucide-react';
import { productsService, type NcoleProduct, type NcoleVariant } from '@/services/api';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

// ─── Recently-viewed localStorage helpers ─────────────────────────────────────
const RV_KEY = 'ncole_recently_viewed';
const MAX_RV = 8;

function getRecentlyViewed(): string[] {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}

function pushRecentlyViewed(id: string): void {
  const prev = getRecentlyViewed().filter(x => x !== id);
  localStorage.setItem(RV_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RV)));
}

// ─── Convert NcoleProduct → legacy Product for ProductCard ───────────────────
function toLegacy(p: NcoleProduct): Product {
  return {
    id: p.id, name: p.name, handle: p.slug,
    description: p.description ?? null,
    price: p.basePrice, sku: p.sku ?? null,
    inventory_qty: p.stockQty,
    images: p.images ?? null, status: p.status,
    has_variants: p.hasVariants,
    vendor: p.vendor?.businessName ?? null,
    vendorId: p.vendorId,
    product_type: p.category?.name ?? null,
    tags: p.tags ?? null, metadata: null,
    variants: p.variants?.map(v => ({
      id: v.id, product_id: p.id, title: v.title, sku: v.sku ?? null,
      price: v.price, inventory_qty: v.stockQty,
      option1: v.option1 ?? null, option2: v.option2 ?? null,
      option3: v.option3 ?? null, image_url: v.imageUrl ?? null, position: null,
    })),
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonDetail: React.FC = () => (
  <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
    <div className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
      <div className="space-y-4">
        <div className="h-4 w-1/4 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 w-1/4 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  </div>
);

// ─── Related products mini-skeleton ──────────────────────────────────────────
const RelatedSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="aspect-square animate-pulse bg-slate-100" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProductDetail: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<NcoleProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<NcoleVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Related products
  const [related, setRelated] = useState<NcoleProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Load product
  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);

    const loadProduct = (p: NcoleProduct) => {
      setProduct(p);
      setSelectedVariant(p.variants?.[0] ?? null);
      // Push to recently viewed
      pushRecentlyViewed(p.id);
    };

    productsService.get(handle)
      .then(r => loadProduct(r.data))
      .catch(() =>
        productsService.bySlug(handle)
          .then(r => { if (r.data[0]) loadProduct(r.data[0]); })
          .catch(() => null),
      )
      .finally(() => setLoading(false));
  }, [handle]);

  // Load related products (same category) once product is set
  useEffect(() => {
    if (!product) return;
    setRelatedLoading(true);
    // Fetch a page of products and filter by same category, excluding current
    productsService.list(1, 20)
      .then(r => {
        const candidates = r.data.filter(p =>
          p.id !== product.id &&
          (product.categoryId ? p.categoryId === product.categoryId : true),
        );
        // prefer same category; fall back to any products if fewer than 4
        const sameCat = candidates.filter(p => p.categoryId === product.categoryId);
        setRelated((sameCat.length >= 4 ? sameCat : candidates).slice(0, 8));
      })
      .catch(() => setRelated([]))
      .finally(() => setRelatedLoading(false));
  }, [product]);

  // Load recently viewed from localStorage (after product is set, exclude current)
  useEffect(() => {
    if (!product) return;
    const ids = getRecentlyViewed().filter(id => id !== product.id).slice(0, 8);
    if (ids.length === 0) { setRecentlyViewed([]); return; }

    Promise.all(ids.map(id =>
      productsService.get(id).then(r => toLegacy(r.data)).catch(() => null),
    )).then(results => {
      setRecentlyViewed(results.filter(Boolean) as Product[]);
    });
  }, [product]);

  if (loading) return <SkeletonDetail />;
  if (!product) return (
    <div className="py-24 text-center">
      <p className="text-slate-500">Product not found.</p>
      <Link to="/shop" className="mt-4 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
        Browse Shop
      </Link>
    </div>
  );

  const images = product.images?.length ? product.images : [''];
  const price = selectedVariant?.price ?? product.basePrice;
  const inStock = selectedVariant ? selectedVariant.stockQty > 0 : product.stockQty > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      name: product.name,
      variant_title: selectedVariant?.title,
      price,
      image: images[0],
      vendorId: product.vendorId,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-slate-400 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-orange-600 transition-colors flex-shrink-0">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <Link to="/shop" className="hover:text-orange-600 transition-colors flex-shrink-0">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              <Link to={`/shop/category/${product.category.slug}`} className="hover:text-orange-600 transition-colors flex-shrink-0">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-slate-700 truncate max-w-[140px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="grid gap-6 md:gap-12 md:grid-cols-2">
          {/* ── Image Gallery ── */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="aspect-square w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center text-slate-300 text-sm">
                  No image available
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      i === activeImage ? 'border-orange-500' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div>
            {/* Vendor */}
            {product.vendor?.businessName && (
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                {product.vendor.businessName}
              </span>
            )}

            {/* Category badge */}
            {product.category && (
              <Link
                to={`/shop/category/${product.category.slug}`}
                className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>

            {/* Rating (static UI — no reviews API yet) */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-slate-500">4.8 · 124 reviews</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3 sm:mt-5">
              <span className="text-3xl font-bold text-slate-900 sm:text-4xl">{formatPrice(price)}</span>
              {inStock ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                  In Stock ({selectedVariant ? selectedVariant.stockQty : product.stockQty} left)
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-7">
                <label className="mb-3 block text-sm font-semibold text-slate-900">
                  Select Option
                  {selectedVariant && (
                    <span className="ml-2 font-normal text-orange-500">— {selectedVariant.title}</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.stockQty === 0}
                      className={`min-w-[3rem] rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        selectedVariant?.id === v.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : v.stockQty === 0
                          ? 'cursor-not-allowed border-slate-100 text-slate-300 line-through'
                          : 'border-slate-300 text-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {v.option1 ?? v.title}
                      {v.stockQty === 0 && <span className="ml-1 text-[9px]">OOS</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex items-center gap-3 sm:mt-8 sm:gap-4">
              <div className="flex items-center rounded-full border border-slate-200">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-md ${
                  added ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                {added ? (
                  <><Check className="h-5 w-5" /> Added to Cart!</>
                ) : !inStock ? (
                  'Out of Stock'
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500 sm:mt-8 sm:gap-4 sm:p-5">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="h-5 w-5 text-orange-500" />
                <span>Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                <span>Quality Assured</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {(relatedLoading || related.length > 0) && (
          <section className="mt-16 border-t border-slate-100 pt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {product.category ? `More from ${product.category.name}` : 'You might also like'}
                </p>
              </div>
              <Link
                to={product.category ? `/shop/category/${product.category.slug}` : '/shop'}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                View all →
              </Link>
            </div>
            {relatedLoading ? (
              <RelatedSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {related.slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={toLegacy(p)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Reviews ── */}
        <section className="mt-16 border-t border-slate-100 pt-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Customer Reviews</h2>
          {/* Static placeholder — no reviews API endpoint exists yet */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Amina K.', rating: 5, text: 'Excellent quality product. Arrived faster than expected!' },
              { name: 'Jean P.', rating: 5, text: 'Very happy with this purchase. Will order again.' },
              { name: 'Grace M.', rating: 4, text: 'Good value for money. Packaging was great too.' },
            ].map(r => (
              <div key={r.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">"{r.text}"</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">— {r.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16 border-t border-slate-100 pt-12">
            <div className="mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-400" />
              <h2 className="text-2xl font-bold text-slate-900">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyViewed.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductDetail;
