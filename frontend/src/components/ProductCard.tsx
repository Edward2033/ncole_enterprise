import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const image = product.images?.[0];
  const price = product.has_variants && product.variants?.length
    ? Math.min(...product.variants.map(v => v.price))
    : product.price;
  const isFeatured = product.tags?.includes('featured');
  const isNew = product.tags?.includes('new-arrival');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.has_variants && product.variants?.length) return;
    addToCart({ product_id: product.id, name: product.name, sku: product.sku || product.handle, price: product.price, image, vendorId: product.vendorId }, 1);
  };

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {image ? (
          <img src={image} alt={product.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-sm">No image</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
          {isFeatured && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">Featured</span>}
          {isNew && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">New</span>}
        </div>
        {!product.has_variants && (
          <button onClick={handleQuickAdd} aria-label="Add to cart"
            className="icon-btn absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-200 hover:bg-orange-500 active:scale-95 sm:bottom-3 sm:right-3 sm:h-11 sm:w-11
                       opacity-100 translate-y-0
                       sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.vendor && <span className="text-[10px] font-medium uppercase tracking-wide text-orange-500 sm:text-[11px]">{product.vendor}</span>}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-orange-600 sm:line-clamp-1">{product.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500 sm:text-sm">{product.description}</p>
        <div className="mt-2 flex items-center justify-between sm:mt-3">
          <span className="text-base font-bold text-slate-900 sm:text-lg">{formatPrice(price)}</span>
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium text-slate-600">4.8</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
