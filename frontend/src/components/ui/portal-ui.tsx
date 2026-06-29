import React from 'react';
import { cn } from '@/lib/utils';

// ── Spinner ───────────────────────────────────────────────────────────────────
interface SpinnerProps { className?: string; size?: 'sm' | 'md' | 'lg'; }
export const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size];
  return <div className={cn('animate-spin rounded-full border-2 border-slate-200 border-t-orange-500', s, className)} />;
};

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const PButton: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, disabled, children, className, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const PInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
          'focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);
PInput.displayName = 'PInput';

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export const PTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition resize-none',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
          'focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);
PTextarea.displayName = 'PTextarea';

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; }
export const PSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
          'focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
);
PSelect.displayName = 'PSelect';

// ── Badge ─────────────────────────────────────────────────────────────────────
export const PBadge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
    {children}
  </span>
);

// ── Card ──────────────────────────────────────────────────────────────────────
export const PCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800', className)}>
    {children}
  </div>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const PEmptyState: React.FC<{
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">{icon}</div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
