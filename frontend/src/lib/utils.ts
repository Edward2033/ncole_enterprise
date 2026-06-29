import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRWF(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type Role = "ADMIN" | "VENDOR" | "CUSTOMER" | "RIDER";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PROCESSING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  READY_FOR_PICKUP: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
};

export const PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ARCHIVED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export function hasRole(userRole: Role | undefined, ...roles: Role[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}
