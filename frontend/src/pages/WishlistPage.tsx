import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, X, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const WishlistPage: React.FC = () => {
  const { items, remove, clear, loading } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleMoveToCart = (item: typeof items[0]) => {
    addToCart({
      product_id: item.productId,
      name: item.product.name,
      price: item.product.basePrice,
      image: item.product.images?.[0],
      vendorId: undefined,
    }, 1);
    remove(item.productId);
    toast({ title: 'Moved to cart', description: item.product.name });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div className="aspect-square rounded-xl bg-slate-100 mb-3" />
              <div className="h-4 w-2/3 rounded bg-slate-100 mb-2" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" /> My Wishlist
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} saved item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clear()}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:border-red-300 hover:text-red-500 transition"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-5">
            <Heart className="h-10 w-10 text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Your wishlist is empty</h2>
          <p className="mt-2 text-slate-500">Save products you love and come back to them later.</p>
          <Link
            to="/shop"
            className="mt-6 flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            Browse Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(item => {
            const p = item.product;
            const inStock = p.stockQty > 0;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* Remove button */}
                <button
                  onClick={() => remove(item.productId)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500 transition"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Image */}
                <Link to={`/products/${p.slug}`} className="block aspect-square overflow-hidden bg-slate-50">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]} alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 text-sm">No image</div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                  {p.vendor?.businessName && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-500">
                      {p.vendor.businessName}
                    </span>
                  )}
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-orange-600 transition">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">{formatPrice(p.basePrice)}</span>
                    {!inStock && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={!inStock}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {inStock ? 'Move to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
