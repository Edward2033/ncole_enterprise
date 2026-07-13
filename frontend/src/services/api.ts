// Single fetch-based API client for the Ncole Interpress backend
import { API_BASE as BASE } from '@/config/api';
const TOKENS_KEY = 'ncole_tokens';

export function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || 'null') ?? { accessToken: null, refreshToken: null }; }
  catch { return { accessToken: null, refreshToken: null }; }
}
export function saveTokens(at: string, rt: string) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: at, refreshToken: rt }));
}
export function clearTokens() { localStorage.removeItem(TOKENS_KEY); }

let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: Error) => void }> = [];

export async function doRefresh(): Promise<string | null> {
  const rt = getTokens().refreshToken;
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) {
      // Only wipe tokens on a definitive auth rejection (401/403).
      // A 500/network error should NOT log the user out — it may be temporary.
      if (res.status === 401 || res.status === 403) clearTokens();
      return null;
    }

    const json = await res.json();
    // Backend returns { data: { accessToken, refreshToken } }
    const data = json?.data ?? json;
    if (!data?.accessToken) {
      clearTokens();
      return null;
    }

    saveTokens(data.accessToken, data.refreshToken ?? getTokens().refreshToken);
    return data.accessToken as string;
  } catch {
    // Network error during refresh — do NOT clear tokens, stay logged in.
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;

  // Do NOT force Content-Type when the caller is sending FormData — the browser
  // must set it automatically so the multipart boundary is included.
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string> ?? {}),
  };

  const buildHeaders = (): Record<string, string> => {
    const at = getTokens().accessToken;
    if (at) return { ...headers, Authorization: `Bearer ${at}` };
    const { Authorization: _drop, ...rest } = headers;
    return rest;
  };

  const doRequest = () => fetch(url, { ...init, headers: buildHeaders() });

  let res = await doRequest();

  if (res.status === 401) {
    const rt = getTokens().refreshToken;
    if (rt) {
      if (isRefreshing) {
        // Another request is already refreshing — wait for it
        try {
          await new Promise<string>((resolve, reject) => queue.push({ resolve, reject }));
          res = await doRequest();
        } catch (queueErr) {
          throw queueErr;
        }
      } else {
        isRefreshing = true;
        let newToken: string | null = null;
        try {
          newToken = await doRefresh();
        } finally {
          isRefreshing = false;
        }

        if (newToken) {
          queue.forEach(({ resolve }) => resolve(newToken!));
          queue = [];
          res = await doRequest();
        } else {
          const sessionErr = new Error('Session expired. Please sign in again.');
          queue.forEach(({ reject }) => reject(sessionErr));
          queue = [];
          window.dispatchEvent(new CustomEvent('ncole:session-expired'));
          throw sessionErr;
        }
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}



// ─── Typed service helpers ────────────────────────────────────────────────────

export const authService = {
  login: (email: string, password: string) =>
    apiFetch<ApiResp<AuthTokens | OtpChallenge>>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyOtp: (userId: string, code: string) =>
    apiFetch<ApiResp<AuthTokens>>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ userId, code }) }),
  register: (name: string, email: string, password: string) =>
    apiFetch<ApiResp<AuthTokens>>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: (refreshToken: string) =>
    apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => null),
  me: () => apiFetch<ApiResp<NcoleUser>>('/users/me'),
  forgotPassword: (email: string) =>
    apiFetch<ApiResp<{ message: string }>>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    apiFetch<ApiResp<{ message: string }>>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

export const productsService = {
  list: (page = 1, limit = 20) =>
    apiFetch<ListResp<NcoleProduct>>(`/products?status=ACTIVE&page=${page}&limit=${limit}`),
  get: (id: string) => apiFetch<ApiResp<NcoleProduct>>(`/products/${id}`),
  bySlug: (slug: string) => apiFetch<ListResp<NcoleProduct>>(`/products?status=ACTIVE&slug=${slug}&limit=1`),
};

export const categoriesService = {
  list: () => apiFetch<ApiResp<NcoleCategory[]>>('/categories'),
};

export const ordersService = {
  place: (body: {
    addressId: string;
    paymentMethod: string;
    notes?: string;
    items: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number;
      productName: string;
      variantTitle?: string | null;
      sku?: string | null;
      vendorId: string;
    }>;
  }) =>
    apiFetch<ApiResp<NcoleOrder>>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders: (page = 1, limit = 10) =>
    apiFetch<ListResp<NcoleOrder>>(`/orders/my?page=${page}&limit=${limit}`),
  getById: (id: string) =>
    apiFetch<ApiResp<NcoleOrder>>(`/orders/my/${id}`),
};

export const addressesService = {
  list: () => apiFetch<ApiResp<NcoleAddress[]>>('/addresses'),
  create: (body: Omit<NcoleAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    apiFetch<ApiResp<NcoleAddress>>('/addresses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Omit<NcoleAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) =>
    apiFetch<ApiResp<NcoleAddress>>(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<ApiResp<NcoleAddress>>(`/addresses/${id}`, { method: 'DELETE' }),
};

export const usersService = {
  me: () => apiFetch<ApiResp<NcoleUser>>('/users/me'),
  updateMe: (body: { name?: string; phone?: string; avatarUrl?: string }) =>
    apiFetch<ApiResp<NcoleUser>>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadAvatar: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/products/upload-application-photo`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Avatar upload failed');
    const json = await res.json();
    return json.data.url as string;
  },
};

export const notificationsService = {
  list: () => apiFetch<ApiResp<NcoleNotification[]>>('/notifications'),
  markRead: (id: string) => apiFetch<ApiResp<NcoleNotification>>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiFetch<ApiResp<{ count: number }>>('/notifications/read-all', { method: 'PATCH' }),
  remove: (id: string) => apiFetch<ApiResp<NcoleNotification>>(`/notifications/${id}`, { method: 'DELETE' }),
  getPrefs: () => apiFetch<ApiResp<NcoleNotifPrefs>>('/notifications/preferences'),
  updatePrefs: (body: Partial<NcoleNotifPrefs>) =>
    apiFetch<ApiResp<NcoleNotifPrefs>>('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const billingService = {
  myInvoices: () => apiFetch<ApiResp<NcoleInvoice[]>>('/billing/invoices'),
  invoiceDetail: (id: string) => apiFetch<ApiResp<NcoleInvoice>>(`/billing/invoices/${id}`),
  myPayments: () => apiFetch<ApiResp<NcolePayment[]>>('/billing/payments'),
  payInvoice: (id: string, body: { gateway: string; gatewayRef?: string }) =>
    apiFetch<ApiResp<NcolePayment>>(`/billing/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(body) }),
};

export const statsService = {
  get: () => apiFetch<ApiResp<{ vendors: number; products: number; customers: number; orders: number }>>('/stats'),
};

export const wishlistService = {
  get: () => apiFetch<ApiResp<WishlistData>>('/wishlist'),
  add: (productId: string) =>
    apiFetch<ApiResp<WishlistData>>('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
  remove: (productId: string) =>
    apiFetch<ApiResp<null>>(`/wishlist/${productId}`, { method: 'DELETE' }),
  clear: () =>
    apiFetch<ApiResp<null>>('/wishlist/clear', { method: 'DELETE' }),
  check: (productId: string) =>
    apiFetch<ApiResp<{ inWishlist: boolean }>>(`/wishlist/${productId}/check`),
};

export const reviewsService = {
  list: (productId: string) =>
    apiFetch<ApiResp<ReviewsData>>(`/products/${productId}/reviews`),
  create: (productId: string, body: { rating: number; title?: string; body?: string }) =>
    apiFetch<ApiResp<NcoleReview>>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  delete: (productId: string) =>
    apiFetch<ApiResp<null>>(`/products/${productId}/reviews`, { method: 'DELETE' }),
};

export const applicationsService = {
  submit: (body: ApplicationSubmitBody) =>
    apiFetch<ApiResp<NcoleApplication>>('/applications', { method: 'POST', body: JSON.stringify(body) }),
  uploadPhoto: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/products/upload-application-photo`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Photo upload failed');
    const json = await res.json();
    return json.data.url as string;
  },
};

export const vendorProfileService = {
  getMyProfile: () => apiFetch<ApiResp<NcoleVendorProfile>>('/vendors/me'),
  updateProfile: (id: string, body: Partial<NcoleVendorProfile>) =>
    apiFetch<ApiResp<NcoleVendorProfile>>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const vendorProductsService = {
  list: (page = 1, limit = 20, vendorId?: string) =>
    apiFetch<ListResp<NcoleVendorProduct>>(`/products?status=ALL&page=${page}&limit=${limit}${vendorId ? `&vendorId=${vendorId}` : ''}`),
  create: (body: Partial<NcoleVendorProduct>) =>
    apiFetch<ApiResp<NcoleVendorProduct>>('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<NcoleVendorProduct>) =>
    apiFetch<ApiResp<NcoleVendorProduct>>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

export const vendorOrdersService = {
  list: (page = 1, limit = 20) =>
    apiFetch<ListResp<NcoleVendorOrder>>(`/orders/vendor?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const deliveriesService = {
  getAssigned: (page = 1, limit = 20) =>
    apiFetch<ListResp<NcoleDelivery>>(`/orders/rider?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// R2+R3: rider profile service — fetches vehicle info, status, verification
export const riderService = {
  getMyProfile: () => apiFetch<ApiResp<NcoleRiderProfile>>('/riders/me'),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResp<T> { success: boolean; data: T; }
export interface ListResp<T> { success: boolean; data: T[]; meta: ApiMeta; }
export interface ApiMeta { page: number; limit: number; total: number; totalPages: number; }
export interface AuthTokens { accessToken: string; refreshToken: string; }
export interface OtpChallenge { requiresOtp: true; userId: string; }

export interface NcoleUser {
  id: string; email: string; name: string; phone?: string;
  role: string; isActive: boolean; createdAt: string; avatarUrl?: string;
}
export interface NcoleProduct {
  id: string; name: string; slug: string; description?: string;
  basePrice: number; sku?: string; stockQty: number;
  images: string[]; tags: string[]; status: string;
  hasVariants: boolean; vendorId: string; categoryId?: string;
  category?: NcoleCategory;
  variants?: NcoleVariant[];
  vendor?: { businessName: string };
}
export interface NcoleVariant {
  id: string; productId: string; title: string; sku?: string;
  price: number; stockQty: number; option1?: string; option2?: string;
  option3?: string; imageUrl?: string;
}
export interface NcoleCategory {
  id: string; name: string; slug: string;
  description?: string; imageUrl?: string; isVisible: boolean;
}
export interface NcoleOrder {
  id: string; orderNumber: string; status: string;
  paymentStatus: string; paymentMethod: string;
  subtotal: number; deliveryFee: number; tax: number; total: number;
  createdAt: string; items: NcoleOrderItem[];
}
export interface NcoleOrderItem {
  id: string; productName: string; variantTitle?: string;
  quantity: number; unitPrice: number; total: number;
  imageUrl?: string;
  product?: { images: string[] };
}
export interface NcoleAddress {
  id: string; userId: string; label?: string; fullName: string;
  phone: string; street: string; district: string;
  city: string; province: string; country: string;
  isDefault: boolean; createdAt: string; updatedAt: string;
}

export interface NcoleNotification {
  id: string; userId: string; type: string; title: string;
  message: string; isRead: boolean; metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NcoleNotifPrefs {
  id?: string; inApp: boolean; email: boolean;
  orderUpdates: boolean; promotions: boolean;
}

export interface NcoleInvoice {
  id: string; invoiceNumber: string; orderId: string;
  status: string; subtotal: number; deliveryFee: number;
  tax: number; total: number; issuedAt: string; paidAt?: string;
  notes?: string;
}

export interface NcolePayment {
  id: string; billingNumber: string; invoiceId: string;
  gateway: string; status: string; amount: number;
  currency: string; gatewayRef?: string;
  submittedAt?: string; completedAt?: string;
  rejectionReason?: string; createdAt: string;
}

export interface NcoleVendorProfile {
  id: string; userId: string; businessName: string; description?: string;
  logoUrl?: string; isVerified: boolean; isActive: boolean; momoNumber?: string;
  createdAt: string; updatedAt: string;
}

export interface NcoleVendorProduct {
  id: string; vendorId: string; categoryId?: string; name: string; slug: string;
  description?: string; basePrice: number; sku?: string; stockQty: number;
  images: string[]; tags: string[]; status: string; hasVariants: boolean;
  createdAt: string; updatedAt: string;
  category?: { name: string; slug: string };
}

export interface NcoleVendorOrderItem {
  id: string; orderId: string; productId: string; vendorId: string;
  productName: string; variantTitle?: string; quantity: number;
  unitPrice: number; total: number; imageUrl?: string;
  product?: { images: string[] };
}

export interface NcoleVendorOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod: string; subtotal: number; deliveryFee: number; total: number;
  createdAt: string; updatedAt: string; items: NcoleVendorOrderItem[];
}

export interface NcoleRiderProfile {
  id: string; userId: string;
  vehicleType: string | null;
  plateNumber: string | null;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  isVerified: boolean;
  createdAt: string; updatedAt: string;
  user: { name: string; email: string; phone: string | null };
}

export interface NcoleDeliveryAddress {
  street: string; district: string; city: string; fullName: string; phone: string;
}

export interface NcoleDeliveryItem {
  id: string; productName: string; quantity: number; unitPrice: number; total: number; imageUrl?: string;
  product?: { images: string[] };
}

export interface NcoleDelivery {
  id: string; orderNumber: string; status: string; paymentMethod: string;
  subtotal: number; deliveryFee: number; total: number; notes?: string;
  createdAt: string; updatedAt: string;
  items: NcoleDeliveryItem[];
  address?: NcoleDeliveryAddress;
}

export interface NcoleApplication {
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
  reviewNote?: string; reviewedAt?: string;
  createdAt: string;
}

export type ApplicationSubmitBody = Omit<NcoleApplication, 'id' | 'status' | 'reviewNote' | 'reviewedAt' | 'createdAt'>;

// ─── Wishlist types ───────────────────────────────────────────────────────────

export interface WishlistProduct {
  id: string; name: string; slug: string; basePrice: number;
  images: string[]; status: string; stockQty: number;
  vendor?: { businessName: string };
  category?: { name: string; slug: string };
}

export interface WishlistItem {
  id: string; productId: string; createdAt: string;
  product: WishlistProduct;
}

export interface WishlistData {
  id: string; userId: string; createdAt: string; updatedAt: string;
  items: WishlistItem[];
}

// ─── Review types ─────────────────────────────────────────────────────────────

export interface NcoleReview {
  id: string; productId: string; userId: string;
  rating: number; title?: string; body?: string;
  createdAt: string; updatedAt: string;
  user: { id: string; name: string; avatarUrl?: string };
}

export interface ReviewsData {
  reviews: NcoleReview[];
  count: number;
  averageRating: number;
}
