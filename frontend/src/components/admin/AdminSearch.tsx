import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export const AdminSearch: React.FC<Props> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={`relative ${className ?? ''}`}>
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white pl-9 pr-9 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition"
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);
