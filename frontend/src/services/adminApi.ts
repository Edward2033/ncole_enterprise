import { apiFetch } from './api';
import { API_BASE } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string; email: string; name: string; phone?: string;
  role: string; isActive: boolean; createdAt: string; avatarUrl?: string;
}

export interface AdminVendor {
  id: string; userId: string; businessName: string;
  description?: string; logoUrl?: string; isVerified: boolean;
  isActive: boolean; momoNumber?: string; createdAt: string;
  user?: { name: string; email: string };
}

export interface AdminProduct {
  id: string; name: string; slug: string; description?: string;
  basePrice: number; sku?: string; stockQty: number;
  images: string[]; tags: string[]; status: string;
  hasVariants: boolean; vendorId: string; categoryId?: string;
  deletedAt?: string | null; createdAt: string;
  category?: { name: string; slug: string };
  vendor?: { businessName: string };
}

export interface AdminCategory {
  id: string; name: string; slug: string; description?: string;
  parentId?: string | null; sortOrder: number;
  isVisible: boolean; createdAt: string;
  children?: AdminCategory[];
}

export interface AdminOrderItem {
  id: string; productName: string; variantTitle?: string;
  quantity: number; unitPrice: number; total: number; vendorId: string;
  product?: { images: string[] };
}

export interface AdminOrder {
  id: string; orderNumber: string; status: string;
  paymentStatus: string; paymentMethod: string;
  subtotal: number; deliveryFee: number; tax: number; total: number;
  notes?: string; createdAt: string; updatedAt: string;
  riderId?: string | null;
  items: AdminOrderItem[];
  customer?: { user: { name: string; email: string } };
  address?: {
    fullName: string; phone: string; street: string;
    district: string; city: string; province: string; country: string;
  } | null;
}

export interface AdminPayment {
  id: string; billingNumber: string; invoiceId: string;
  gateway: string; status: string; amount: number; currency: string;
  gatewayRef?: string; submittedAt?: string; verifiedAt?: string;
  completedAt?: string; rejectedAt?: string; rejectionReason?: string;
  createdAt: string;
  customer?: { user: { name: string; email: string } };
  invoice?: { invoiceNumber: string; orderId: string; total: number };
}

export interface AdminRevenueReport {
  totalRevenue: number;
  byGateway: Record<string, number>;
  count: number;
  payments: { amount: number; gateway: string; completedAt: string; billingNumber: string }[];
}

export interface AdminRider {
  id: string; userId: string; vehicleType?: string | null;
  plateNumber?: string | null; status: string;
  isVerified: boolean; createdAt: string;
  user: { name: string; email: string };
}

export interface AdminNotification {
  id: string; userId: string; type: string; title: string;
  message: string; isRead: boolean; createdAt: string;
}

export interface ApiMeta { page: number; limit: number; total: number; totalPages: number; }
export interface ApiResp<T> { success: boolean; data: T; }
export interface ListResp<T> { success: boolean; data: T[]; meta: ApiMeta; }

// ─── Users ────────────────────────────────────────────────────────────────────

export const adminUsersApi = {
  list: (page = 1, limit = 20) =>
    apiFetch<ListResp<AdminUser>>(`/users?page=${page}&limit=${limit}`),
  update: (id: string, body: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean }) =>
    apiFetch<ApiResp<AdminUser>>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  create: (body: { name: string; email: string; password: string; phone?: string; role: string }) =>
    apiFetch<ApiResp<AdminUser>>('/users', { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiFetch('/users/me/change-password', { method: 'POST', body: JSON.stringify(body) }),
  resetUserPassword: (id: string, body: { newPassword: string; notifyUser?: boolean }) =>
    apiFetch<ApiResp<{ message: string }>>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(body) }),
  updateMe: (body: { name?: string; email?: string; phone?: string; avatarUrl?: string }) =>
    apiFetch<ApiResp<AdminUser>>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Vendors ──────────────────────────────────────────────────────────────────

export const adminVendorsApi = {
  list: () =>
    apiFetch<ApiResp<AdminVendor[]>>('/vendors?all=true'),
  update: (id: string, body: Partial<{ businessName: string; description: string; isVerified: boolean; isActive: boolean; momoNumber: string; logoUrl: string }>) =>
    apiFetch<ApiResp<AdminVendor>>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  backfill: () =>
    apiFetch<ApiResp<{ checked: number; created: number }>>('/vendors/backfill', { method: 'POST' }),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export interface CreateProductBody {
  name: string;
  slug: string;
  vendorId: string;
  categoryId?: string;
  description?: string;
  /** Integer RWF, must be positive */
  basePrice: number;
  sku?: string;
  stockQty?: number;
  images?: string[];
  tags?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

export const adminProductsApi = {
  list: (params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string; vendorId?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page)       p.set('page',       String(params.page));
    // Backend max limit is 100 — never exceed it
    if (params.limit)      p.set('limit',      String(Math.min(params.limit, 100)));
    if (params.q)          p.set('q',          params.q);
    if (params.status)     p.set('status',     params.status);
    if (params.categoryId) p.set('categoryId', params.categoryId);
    if (params.vendorId)   p.set('vendorId',   params.vendorId);
    return apiFetch<ListResp<AdminProduct>>(`/products?${p.toString()}`);
  },
  get: (id: string) => apiFetch<ApiResp<AdminProduct>>(`/products/${id}`),
  /**
   * Create a product. Backend createProductSchema:
   *   vendorId (required for ADMIN), name, slug, basePrice (int), stockQty, images[], tags[], status, etc.
   */
  create: (body: CreateProductBody) =>
    apiFetch<ApiResp<AdminProduct>>('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<ApiResp<AdminProduct>>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<ApiResp<AdminProduct>>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const adminCategoriesApi = {
  /** Admin list — fetches ALL categories including hidden ones (?all=true) */
  list: () => apiFetch<ApiResp<AdminCategory[]>>('/categories?all=true'),
  create: (body: { name: string; slug: string; description?: string; parentId?: string; sortOrder?: number; isVisible?: boolean }) =>
    apiFetch<ApiResp<AdminCategory>>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; slug: string; description: string; parentId: string | null; sortOrder: number; isVisible: boolean }>) =>
    apiFetch<ApiResp<AdminCategory>>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<ApiResp<void>>(`/categories/${id}`, { method: 'DELETE' }),
  seedDefaults: () =>
    apiFetch<ApiResp<{ created: number; skipped: number }>>('/categories/seed', { method: 'POST' }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const adminOrdersApi = {
  list: (page = 1, limit = 20) =>
    apiFetch<ListResp<AdminOrder>>(`/orders?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: string) =>
    apiFetch<ApiResp<AdminOrder>>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignRider: (id: string, riderId: string) =>
    apiFetch<ApiResp<AdminOrder>>(`/orders/${id}/assign-rider`, { method: 'PATCH', body: JSON.stringify({ riderId }) }),
};

// ─── Billing ──────────────────────────────────────────────────────────────────

export const adminBillingApi = {
  listPayments: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page)   p.set('page',   String(params.page ?? 1));
    if (params.limit)  p.set('limit',  String(params.limit ?? 20));
    if (params.status) p.set('status', params.status);
    return apiFetch<ListResp<AdminPayment>>(`/billing/admin/payments?${p.toString()}`);
  },
  verifyPayment: (id: string, action: 'VERIFY' | 'REJECT', rejectionReason?: string) =>
    apiFetch<ApiResp<AdminPayment>>(`/billing/admin/payments/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ action, ...(rejectionReason ? { rejectionReason } : {}) }),
    }),
  revenueReport: (from?: string, to?: string) => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to)   p.set('to',   to);
    return apiFetch<ApiResp<AdminRevenueReport>>(`/billing/admin/reports/revenue?${p.toString()}`);
  },
};

// ─── Riders ───────────────────────────────────────────────────────────────────

export const adminRidersApi = {
  list: () => apiFetch<ApiResp<AdminRider[]>>('/riders'),
  update: (id: string, body: Partial<{ isVerified: boolean; vehicleType: string; plateNumber: string; status: string }>) =>
    apiFetch<ApiResp<AdminRider>>(`/riders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<ApiResp<null>>(`/riders/${id}`, { method: 'DELETE' }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AdminNotificationWithUser extends AdminNotification {
  user?: { name: string; email: string; role: string };
}

export const adminNotificationsApi = {
  /** Admin's own notifications */
  list: () => apiFetch<ApiResp<AdminNotification[]>>('/notifications'),
  /** Platform-wide notifications (all users, paginated) */
  listAll: (page = 1, limit = 50) =>
    apiFetch<ListResp<AdminNotificationWithUser>>(`/notifications/admin/all?page=${page}&limit=${limit}`),
  broadcast: (body: { type: string; title: string; message: string; userIds?: string[] }) =>
    apiFetch<ApiResp<{ sent: number }>>('/notifications/broadcast', { method: 'POST', body: JSON.stringify(body) }),
  markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  delete: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Activity Log ────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export const adminActivityLogApi = {
  list: (page = 1, limit = 50, action?: string) => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) p.set('action', action);
    return apiFetch<ListResp<ActivityLogEntry>>(`/users/activity-log?${p.toString()}`);
  },
};

// ─── Applications ────────────────────────────────────────────────────────────

export interface AdminApplication {
  id: string;
  role: 'VENDOR' | 'RIDER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fullName: string; email: string; phone: string;
  nationalId: string; dateOfBirth: string;
  address: string; district: string; province: string;
  photoUrl?: string;
  businessName?: string; businessType?: string; businessAddress?: string;
  momoNumber?: string; yearsInBusiness?: number; description?: string;
  vehicleType?: string; plateNumber?: string; licenseNumber?: string;
  deliveryZone?: string; experience?: string;
  emergencyName: string; emergencyPhone: string;
  reviewedBy?: string; reviewNote?: string; reviewedAt?: string;
  userId?: string;
  createdAt: string; updatedAt: string;
}

export const adminApplicationsApi = {
  list: (status?: string, role?: string) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (role)   p.set('role',   role);
    return apiFetch<ApiResp<AdminApplication[]>>(`/applications?${p.toString()}`);
  },
  get: (id: string) =>
    apiFetch<ApiResp<AdminApplication>>(`/applications/${id}`),
  review: (id: string, action: 'APPROVE' | 'REJECT', reviewNote?: string) =>
    apiFetch<ApiResp<AdminApplication>>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, ...(reviewNote ? { reviewNote } : {}) }),
    }),
  adminApply: (body: Record<string, unknown>, autoApprove = false) =>
    apiFetch<ApiResp<AdminApplication>>('/applications/admin/apply', {
      method: 'POST',
      body: JSON.stringify({ ...body, autoApprove }),
    }),
  uploadPhoto: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${API_BASE}/products/upload-application-photo`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Photo upload failed');
    const json = await res.json();
    return json.data.url as string;
  },
};

// ─── Public stats ─────────────────────────────────────────────────────────────

export const adminStatsApi = {
  get: () => apiFetch<ApiResp<{ vendors: number; products: number; customers: number; orders: number }>>('/stats'),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  platformName: string;
  version: string;
  storefrontUrl: string;
  customerPortalUrl: string;
  vendorPortalUrl: string;
  riderPortalUrl: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  linkUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowAdmins: boolean;
  allowVendors: boolean;
  allowRiders: boolean;
}

export const adminSettingsApi = {
  // Platform
  getPlatform: () =>
    apiFetch<ApiResp<PlatformConfig>>('/settings/platform'),
  updatePlatform: (body: Partial<PlatformConfig>) =>
    apiFetch<ApiResp<PlatformConfig>>('/settings/platform', { method: 'PATCH', body: JSON.stringify(body) }),

  // Hero Slides
  getSlides: () =>
    apiFetch<ApiResp<HeroSlide[]>>('/settings/hero-slides'),
  createSlide: (body: Omit<HeroSlide, 'id' | 'createdAt'>) =>
    apiFetch<ApiResp<HeroSlide>>('/settings/hero-slides', { method: 'POST', body: JSON.stringify(body) }),
  updateSlide: (id: string, body: Partial<Omit<HeroSlide, 'id' | 'createdAt'>>) =>
    apiFetch<ApiResp<HeroSlide>>(`/settings/hero-slides/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSlide: (id: string) =>
    apiFetch<ApiResp<null>>(`/settings/hero-slides/${id}`, { method: 'DELETE' }),
  reorderSlides: (ids: string[]) =>
    apiFetch<ApiResp<HeroSlide[]>>('/settings/hero-slides/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),

  // Banners
  getBanners: () =>
    apiFetch<ApiResp<Banner[]>>('/settings/banners'),
  createBanner: (body: Omit<Banner, 'id' | 'createdAt'>) =>
    apiFetch<ApiResp<Banner>>('/settings/banners', { method: 'POST', body: JSON.stringify(body) }),
  updateBanner: (id: string, body: Partial<Omit<Banner, 'id' | 'createdAt'>>) =>
    apiFetch<ApiResp<Banner>>(`/settings/banners/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBanner: (id: string) =>
    apiFetch<ApiResp<null>>(`/settings/banners/${id}`, { method: 'DELETE' }),

  // Maintenance
  getMaintenance: () =>
    apiFetch<ApiResp<MaintenanceConfig>>('/settings/maintenance'),
  updateMaintenance: (body: Partial<MaintenanceConfig>) =>
    apiFetch<ApiResp<MaintenanceConfig>>('/settings/maintenance', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Site Settings ────────────────────────────────────────────────────────────

export interface SiteSettings {
  siteName: string;
  supportEmail: string;
  contactEmail: string;
  whatsappNumber: string;
  phoneNumber: string;
  githubUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  footerText?: string;
  address?: string;
}

export const adminSiteSettingsApi = {
  get: () => apiFetch<ApiResp<SiteSettings>>('/settings/site-settings'),
  update: (body: Partial<SiteSettings>) =>
    apiFetch<ApiResp<SiteSettings>>('/settings/site-settings', { method: 'PUT', body: JSON.stringify(body) }),
};
