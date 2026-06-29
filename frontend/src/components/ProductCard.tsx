import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthPromptModal from '@/components/AuthPromptModal';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const image = product.images?.[0];
  const price = product.has_variants && product.variants?.length
    ? Math.min(...product.variants.map(v => v.price))
    : product.price;
  const isFeatured = product.tags?.includes('featured');
  const isNew = product.tags?.includes('new-arrival');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { setShowPrompt(true); return; }
    if (product.has_variants && product.variants?.length) return;
    addToCart({ product_id: product.id, name: product.name, sku: product.sku || product.handle, price: product.price, image }, 1);
  };

  return (
    <>
      {showPrompt && (
        <AuthPromptModal onClose={() => setShowPrompt(false)} onLogin={() => { setShowPrompt(false); navigate('/login'); }} />
      )}
      <Link
        to={`/products/${product.handle}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
      >
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {image ? (
            <img src={image} alt={product.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 text-sm">No image</div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {isFeatured && <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Featured</span>}
            {isNew && <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">New</span>}
          </div>
          {!product.has_variants && (
            <button onClick={handleQuickAdd} aria-label="Add to cart"
              className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-orange-500 group-hover:translate-y-0 group-hover:opacity-100">
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {product.vendor && <span className="text-[11px] font-medium uppercase tracking-wide text-orange-500">{product.vendor}</span>}
          <h3 className="mt-1 line-clamp-1 font-semibold text-slate-900 group-hover:text-orange-600">{product.name}</h3>
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{product.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">{formatPrice(price)}</span>
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-600">4.8</span>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};

export default ProductCard;
