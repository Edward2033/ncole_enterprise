import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  page?: number;
  totalPages?: number;
  total?: number;
  onPage?: (p: number) => void;
  className?: string;
}

function Skeleton({ cols }: { cols: number }) {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" style={{ width: `${50 + ((i * 3 + j * 7) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function AdminTable<T>({
  columns, data, keyFn, loading, emptyText = 'No records found',
  emptyIcon, page, totalPages, total, onPage, className,
}: Props<T>) {
  return (
    <div className={`flex flex-col gap-0 ${className ?? ''}`}>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {loading ? (
            <Skeleton cols={columns.length} />
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    {emptyIcon && <div className="opacity-30 [&>svg]:h-12 [&>svg]:w-12">{emptyIcon}</div>}
                    <p className="text-sm font-medium">{emptyText}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {data.map(row => (
                <tr key={keyFn(row)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 align-middle">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {onPage && totalPages != null && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-3">
          <p className="text-xs text-slate-500">
            {total != null ? `${total.toLocaleString()} total` : `Page ${page ?? 1} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(Math.max(1, (page ?? 1) - 1))}
              disabled={(page ?? 1) <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[60px] text-center text-xs text-slate-600 dark:text-slate-400">
              {page ?? 1} / {totalPages}
            </span>
            <button
              onClick={() => onPage(Math.min(totalPages, (page ?? 1) + 1))}
              disabled={(page ?? 1) >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
