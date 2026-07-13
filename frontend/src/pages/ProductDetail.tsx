import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Minus, Plus, ShoppingCart, Check, Truck, ShieldCheck,
  Clock, ChevronRight, Eye, Star, Package2, Tag, Heart, BadgeCheck,
} from 'lucide-react';
import { productsService, reviewsService, type NcoleProduct, type NcoleVariant, type NcoleReview, type ReviewsData } from '@/services/api';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

// ─── Recently-viewed helpers ──────────────────────────────────────────────────
const RV_KEY = 'ncole_recently_viewed';
const MAX_RV = 8;

function getRecentlyViewed(): string[] {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}
function pushRecentlyViewed(id: string) {
  const prev = getRecentlyViewed().filter(x => x !== id);
  localStorage.setItem(RV_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RV)));
}

// ─── Star display (read-only) ─────────────────────────────────────────────────
const StarDisplay: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'h-4 w-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} className={`${size} ${
        s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200'
      }`} />
    ))}
  </div>
);

// ─── Interactive star rating widget ──────────────────────────────────────────
const StarRating: React.FC<{
  productId: string;
  onSubmit: (rating: number, title: string, body: string) => Promise<void>;
  existing?: NcoleReview | null;
}> = ({ onSubmit, existing }) => {
  const [hover, setHover] = useState(0);
  const [rated, setRated] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rated) return;
    setSubmitting(true);
    try {
      await onSubmit(rated, title, body);
      setDone(true);
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
      <Check className="h-4 w-4" /> Review submitted — thank you!
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button"
              onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
              onClick={() => setRated(s)}
              className="transition-transform hover:scale-110 active:scale-95">
              <Star className={`h-6 w-6 transition-colors ${
                s <= (hover || rated) ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300'
              }`} />
            </button>
          ))}
        </div>
        {rated > 0 && <span className="text-sm font-medium text-amber-600">{rated}/5</span>}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
        placeholder="Share your experience..."
        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
      <button type="submit" disabled={!rated || submitting}
        className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40 transition">
        {submitting ? 'Submitting…' : existing ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
};

// ─── Description renderer — handles plain text with paragraph breaks ──────────
const ProductDescription: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const lines = text.split(/\n/).filter(Boolean);
  const isBulletList = lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('•'));

  if (isBulletList) {
    return (
      <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
        {lines.map((line, i) => {
          const clean = line.replace(/^[-•]\s*/, '').trim();
          if (!clean) return null;
          return (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
              <span>{clean}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (paragraphs.length > 1) {
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-600">{p.trim()}</p>
        ))}
      </div>
    );
  }

  return <p className="text-sm leading-relaxed text-slate-600">{text}</p>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Skeletons ────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProductDetail: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<NcoleProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<NcoleVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [wishlisted, setWishlisted] = useState(false);

  const [related, setRelated] = useState<NcoleProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadReviews = useCallback((productId: string) => {
    setReviewsLoading(true);
    reviewsService.list(productId)
      .then(r => setReviewsData(r.data))
      .catch(() => setReviewsData(null))
      .finally(() => setReviewsLoading(false));
  }, []);

  useEffect(() => {
    // PHASE 3 FIX: fetch by slug only — backend now resolves slug OR id in getProductById.
    // Never fall back to treating the slug as an ID (that caused wrong product to load).
    if (!handle) return;
    setLoading(true);
    setProduct(null);
    setActiveImage(0);
    setQuantity(1);
    setSelectedVariant(null);
    setReviewsData(null);
    productsService.get(handle)
      .then(r => {
        setProduct(r.data);
        setSelectedVariant(r.data.variants?.[0] ?? null);
        pushRecentlyViewed(r.data.id);
        loadReviews(r.data.id);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [handle, loadReviews]);

  useEffect(() => {
    if (!product) return;
    setWishlisted(isWishlisted(product.id));
  }, [product, isWishlisted]);

  useEffect(() => {
    if (!product) return;
    setRelatedLoading(true);
    productsService.list(1, 20)
      .then(r => {
        const candidates = r.data.filter(p => p.id !== product.id);
        const sameCat = candidates.filter(p => p.categoryId === product.categoryId);
        setRelated((sameCat.length >= 4 ? sameCat : candidates).slice(0, 8));
      })
      .catch(() => setRelated([]))
      .finally(() => setRelatedLoading(false));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const ids = getRecentlyViewed().filter(id => id !== product.id).slice(0, 8);
    if (!ids.length) { setRecentlyViewed([]); return; }
    Promise.all(ids.map(id => productsService.get(id).then(r => toLegacy(r.data)).catch(() => null)))
      .then(r => setRecentlyViewed(r.filter(Boolean) as Product[]));
  }, [product]);

  const handleWishlistToggle = () => {
    if (!product) return;
    toggleWishlist(product.id);
    setWishlisted(v => !v);
  };

  const handleReviewSubmit = async (rating: number, title: string, body: string) => {
    if (!product) return;
    await reviewsService.create(product.id, { rating, title: title || undefined, body: body || undefined });
    loadReviews(product.id);
  };

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
  const stockQty = selectedVariant ? selectedVariant.stockQty : product.stockQty;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      name: product.name,
      variant_title: selectedVariant?.title,
      price, image: images[0],
      vendorId: product.vendorId,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const avgRating = reviewsData?.averageRating ?? 0;
  const reviewCount = reviewsData?.count ?? 0;
  const myReview = reviewsData?.reviews.find(r => r.userId === user?.id) ?? null;

  // Build specs from metadata + tags
  const specs: Array<{ label: string; value: string }> = [];
  if (product.sku) specs.push({ label: 'SKU', value: product.sku });
  if (product.category?.name) specs.push({ label: 'Category', value: product.category.name });
  if (product.vendor?.businessName) specs.push({ label: 'Vendor', value: product.vendor.businessName });
  if (product.hasVariants) specs.push({ label: 'Variants', value: `${product.variants?.length ?? 0} options` });
  specs.push({ label: 'Availability', value: inStock ? `In Stock (${stockQty} units)` : 'Out of Stock' });
  if (product.metadata && typeof product.metadata === 'object') {
    Object.entries(product.metadata as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') {
        specs.push({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) });
      }
    });
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-slate-400 overflow-x-auto whitespace-nowrap pb-1" aria-label="Breadcrumb">
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

        {/* Main grid */}
        <div className="grid gap-8 md:gap-14 md:grid-cols-2">

          {/* ── Image Gallery ── */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]} alt={product.name}
                  className="aspect-square w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center gap-3 text-slate-300">
                  <Package2 className="h-16 w-16" />
                  <span className="text-sm">No image available</span>
                </div>
              )}
            </div>
            {images.filter(Boolean).length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.filter(Boolean).map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`h-18 w-18 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                      i === activeImage
                        ? 'border-orange-500 shadow-md shadow-orange-200'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                    style={{ height: 72, width: 72 }}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col gap-5">

            {/* Vendor + Category */}
            <div className="flex flex-wrap items-center gap-2">
              {product.vendor?.businessName && (
                <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  {product.vendor.businessName}
                </span>
              )}
              {product.category && (
                <Link
                  to={`/shop/category/${product.category.slug}`}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition"
                >
                  {product.category.name}
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{product.name}</h1>

            {/* Wishlist button */}
            <button onClick={handleWishlistToggle}
              className={`flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold transition ${
                wishlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500'
              }`}>
              <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500' : ''}`} />
              {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>

            {/* Star Rating summary */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <StarDisplay rating={avgRating} size="h-4 w-4" />
                <span className="text-sm font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price + Stock */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{formatPrice(price)}</span>
              {inStock ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  In Stock · {stockQty} left
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="mb-2.5 text-sm font-semibold text-slate-900">
                  Select Option
                  {selectedVariant && <span className="ml-2 font-normal text-orange-500">— {selectedVariant.title}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.stockQty === 0}
                      className={`min-w-[3rem] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        selectedVariant?.id === v.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : v.stockQty === 0
                          ? 'cursor-not-allowed border-slate-100 text-slate-300 line-through'
                          : 'border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600'
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
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
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
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg ${
                  added
                    ? 'bg-emerald-500 shadow-emerald-500/25'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
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
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-500">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Quality Assured</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    <Tag className="h-3 w-3" />#{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs: Description / Specs / Reviews ── */}
        <div className="mt-14 border-t border-slate-100 pt-10">
          <div className="flex gap-1 border-b border-slate-200 mb-8">
            {(['description', 'specs', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold capitalize transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-2xl">
              {product.description ? (
                <ProductDescription text={product.description} />
              ) : (
                <p className="text-sm text-slate-400 italic">No description provided for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl overflow-hidden rounded-2xl border border-slate-200">
              {specs.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 italic">No specifications available.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {specs.map(s => (
                      <tr key={s.label} className="even:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-700 w-2/5">{s.label}</td>
                        <td className="px-5 py-3 text-slate-600">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-2xl space-y-6">
              {/* Summary */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-slate-900">{avgRating.toFixed(1)}</p>
                    <StarDisplay rating={avgRating} size="h-5 w-5" />
                    <p className="mt-1 text-xs text-slate-400">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const count = reviewsData!.reviews.filter(r => r.rating === star).length;
                      const pct = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-slate-500">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-slate-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : reviewsData?.reviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="font-semibold text-slate-700">No reviews yet</p>
                  <p className="mt-1 text-sm text-slate-400">Be the first to review this product</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData?.reviews.map(r => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                            {r.user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{r.user.name}</p>
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <BadgeCheck className="h-3 w-3" /> Verified
                              </span>
                            </div>
                            <StarDisplay rating={r.rating} size="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.title && <p className="mt-3 text-sm font-semibold text-slate-800">{r.title}</p>}
                      {r.body && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Write a review */}
              {isAuthenticated ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-4 text-sm font-bold text-slate-900">
                    {myReview ? 'Update Your Review' : 'Write a Review'}
                  </p>
                  <StarRating
                    productId={product.id}
                    onSubmit={handleReviewSubmit}
                    existing={myReview}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center">
                  <p className="text-sm text-slate-500">Sign in to leave a review</p>
                  <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-orange-600 hover:underline">Sign In</Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Related Products ── */}
        {(relatedLoading || related.length > 0) && (
          <section className="mt-16 border-t border-slate-100 pt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Related Products</h2>
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
            {relatedLoading ? <RelatedSkeleton /> : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {related.slice(0, 4).map(p => <ProductCard key={p.id} product={toLegacy(p)} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16 border-t border-slate-100 pt-12">
            <div className="mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyViewed.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductDetail;
