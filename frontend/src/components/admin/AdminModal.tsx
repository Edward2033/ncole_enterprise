import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export const AdminModal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizeMap[size]} rounded-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  danger?: boolean;
  confirmLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmProps> = ({
  open, onClose, onConfirm, title, message, loading, danger, confirmLabel,
}) => (
  <AdminModal
    open={open} onClose={onClose} title={title} size="sm"
    footer={
      <>
        <button onClick={onClose} disabled={loading}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 inline-flex items-center gap-2 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
          {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {confirmLabel ?? (loading ? 'Processing…' : 'Confirm')}
        </button>
      </>
    }
  >
    <div className="flex gap-3">
      <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  </AdminModal>
);
