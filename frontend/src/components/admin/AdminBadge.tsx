import React from 'react';

interface Props { label: string; color?: string; className?: string; }

const COLORS: Record<string, string> = {
  green:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  slate:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  cyan:   'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  teal:   'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

export const AdminBadge: React.FC<Props> = ({ label, color = 'slate', className }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[color] ?? COLORS.slate} ${className ?? ''}`}>
    {label}
  </span>
);

export function roleBadge(role: string) {
  const map: Record<string, [string, string]> = {
    ADMIN:    ['Admin',    'red'],
    VENDOR:   ['Vendor',   'purple'],
    CUSTOMER: ['Customer', 'blue'],
    RIDER:    ['Rider',    'teal'],
  };
  const [label, color] = map[role] ?? [role, 'slate'];
  return <AdminBadge label={label} color={color} />;
}

export function statusBadge(isActive: boolean) {
  return <AdminBadge label={isActive ? 'Active' : 'Inactive'} color={isActive ? 'green' : 'red'} />;
}

export function orderStatusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    PENDING:          ['Pending',         'yellow'],
    CONFIRMED:        ['Confirmed',       'blue'],
    PROCESSING:       ['Processing',      'purple'],
    READY_FOR_PICKUP: ['Ready',           'cyan'],
    OUT_FOR_DELIVERY: ['Out for Delivery','orange'],
    DELIVERED:        ['Delivered',       'green'],
    CANCELLED:        ['Cancelled',       'red'],
    REFUNDED:         ['Refunded',        'slate'],
  };
  const [label, color] = map[status] ?? [status.replace(/_/g,' '), 'slate'];
  return <AdminBadge label={label} color={color} />;
}

export function paymentStatusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    PENDING:   ['Pending',   'yellow'],
    SUBMITTED: ['Submitted', 'blue'],
    VERIFIED:  ['Verified',  'cyan'],
    COMPLETED: ['Completed', 'green'],
    REJECTED:  ['Rejected',  'red'],
  };
  const [label, color] = map[status] ?? [status, 'slate'];
  return <AdminBadge label={label} color={color} />;
}

export function productStatusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    ACTIVE:   ['Active',   'green'],
    DRAFT:    ['Draft',    'yellow'],
    ARCHIVED: ['Archived', 'slate'],
  };
  const [label, color] = map[status] ?? [status, 'slate'];
  return <AdminBadge label={label} color={color} />;
}

export function verifiedBadge(isVerified: boolean) {
  return <AdminBadge label={isVerified ? 'Verified' : 'Pending'} color={isVerified ? 'green' : 'yellow'} />;
}
