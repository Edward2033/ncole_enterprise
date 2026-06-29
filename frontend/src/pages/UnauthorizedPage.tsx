import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, LogIn, Home, ArrowLeft } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Icon */}
      <div className="relative select-none">
        <span className="text-[10rem] font-black leading-none text-slate-100">401</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500 shadow-2xl shadow-red-500/40">
            <ShieldOff className="h-9 w-9 text-white" />
          </div>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-bold text-slate-900">Access Denied</h1>
      <p className="mt-3 max-w-sm text-slate-500">
        You don't have permission to view this page. Please sign in with an account that has the required access.
      </p>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/login"
          className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95">
          <LogIn className="h-4 w-4" /> Sign In
        </Link>
        <Link to="/"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 transition active:scale-95">
          <Home className="h-4 w-4" /> Back to Home
        </Link>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 transition active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>

      <div className="mt-12 text-sm text-slate-400">
        Need help?{' '}
        <a href="mailto:hello@ncoleinterpress.com" className="text-orange-500 hover:text-orange-600 font-medium">Contact support</a>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
