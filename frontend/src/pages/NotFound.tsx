import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Search, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Animated number */}
      <div className="relative select-none">
        <span className="text-[10rem] font-black leading-none text-slate-100">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-2xl shadow-orange-500/40">
            <Search className="h-9 w-9 text-white" />
          </div>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-3 max-w-sm text-slate-500">
        The page <span className="font-mono text-sm font-semibold text-orange-600">{location.pathname}</span> doesn't exist or has been moved.
      </p>

      {/* Quick links */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/"
          className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95">
          <Home className="h-4 w-4" /> Back to Home
        </Link>
        <Link to="/shop"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 transition active:scale-95">
          <ShoppingBag className="h-4 w-4" /> Browse Shop
        </Link>
        <button onClick={() => window.history.back()}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 transition active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>

      {/* Helpful links */}
      <div className="mt-12 text-sm text-slate-400">
        Looking for something specific?{' '}
        <Link to="/shop?q=" className="text-orange-500 hover:text-orange-600 font-medium">Search the shop</Link>
        {' '}or{' '}
        <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">sign in</Link>
        {' '}to your account.
      </div>
    </div>
  );
};

export default NotFound;
