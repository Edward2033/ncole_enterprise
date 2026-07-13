import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { reviewsService } from '@/services/api';

// Simple per-product rating cache to avoid redundant fetches
const ratingCache = new Map<string, { avg: number; count: number }>();

function useProductRating(productId: string) {
  const [rating, setRating] = useState(() => ratingCache.get(productId) ?? null);
  useEffect(() => {
    if (ratingCache.has(productId)) return;
    reviewsService.list(productId)
      .then(r => {
        const val = { avg: r.data.averageRating, count: r.data.count };
        ratingCache.set(productId, val);
        setRating(val);
      })
      .catch(() => null);
  }, [productId]);
  return rating;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const rating = useProductRating(product.id);

  const image      = product.images?.[0];
  const image2     = product.images?.[1];
  const price      = product.has_variants && product.variants?.length
    ? Math.min(...product.variants.map(v => v.price))
    : product.price;
  const isFeatured = product.tags?.includes('featured');
  const isNew      = product.tags?.includes('new-arrival');
  const inStock    = product.inventory_qty === null || product.inventory_qty > 0;
  const wishlisted = isWishlisted(product.id);

  const avgRating  = rating?.avg ?? 0;
  const reviewCount = rating?.count ?? 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.has_variants && product.variants?.length) return;
    if (!inStock) return;
    addToCart({
      product_id: product.id,
      name: product.name,
      sku: product.sku || product.handle,
      price: product.price,
      image,
      vendorId: product.vendorId,
    }, 1);
    toast({ title: 'Added to cart', description: product.name });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    toast({
      title: wishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: product.name,
    });
  };

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 active:scale-[0.98]"
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {image ? (
          <>
            <img
              src={image} alt={product.name} loading="lazy"
              className={`h-full w-full object-cover transition-all duration-500 ${image2 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            />
            {image2 && (
              <img
                src={image2} alt={product.name} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-sm">No image</div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
          {isFeatured && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              Featured
            </span>
          )}
          {isNew && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              New
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              Sold out
            </span>
          )}
        </div>

        {/* Wishlist button — always visible on mobile, hover on desktop */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-200
            sm:right-3 sm:top-3 sm:h-9 sm:w-9
            sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0
            ${wishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-slate-400 hover:bg-red-50 hover:text-red-500'
            }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick add to cart — only for simple products */}
        {!product.has_variants && inStock && (
          <button
            onClick={handleQuickAdd}
            aria-label="Add to cart"
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-200 hover:bg-orange-500 active:scale-95
                       sm:bottom-3 sm:right-3 sm:h-10 sm:w-10
                       opacity-100 translate-y-0
                       sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.vendor && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-orange-500 sm:text-[11px]">
            {product.vendor}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-orange-600 sm:line-clamp-1">
          {product.name}
        </h3>

        {/* Static star display */}
        <div className="mt-1 flex items-center gap-1">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`h-3 w-3 ${
              s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200'
            }`} />
          ))}
          <span className="text-[10px] text-slate-400 ml-0.5">
            {reviewCount > 0 ? `(${reviewCount})` : ''}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between sm:mt-3">
          <span className="text-base font-bold text-slate-900 sm:text-lg">{formatPrice(price)}</span>
          {product.product_type && (
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 sm:inline">
              {product.product_type}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
