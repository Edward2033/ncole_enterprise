// Single fetch-based API client for the N_COLE Express backend
const BASE = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:4000/api/v1';
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
let queue: Array<(t: string) => void> = [];

async function doRefresh(): Promise<string | null> {
  const rt = getTokens().refreshToken;
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const json = await res.json();
    // Backend returns { data: { accessToken, refreshToken } }
    const data = json?.data ?? json;
    if (!data?.accessToken) {
      clearTokens();
      return null;
    }

    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };

  const attachAuth = (token: string | null) => {
    if (token) headers['Authorization'] = `Bearer ${token}`;
    else delete headers['Authorization'];
  };

  const doRequest = async () => {
    // Always attach the latest access token right before the request
    attachAuth(getTokens().accessToken);
    return fetch(url, { ...init, headers });
  };

  let res = await doRequest();

  if (res.status === 401) {
    const rt = getTokens().refreshToken;
    if (rt) {
      if (isRefreshing) {
        const newToken = await new Promise<string>((resolve) => queue.push(resolve));
        attachAuth(newToken);
        res = await doRequest();
      } else {
        isRefreshing = true;
        const newToken = await doRefresh();
        isRefreshing = false;
        queue.forEach((cb) => newToken && cb(newToken));
        queue = [];

        if (newToken) {
          attachAuth(newToken);
          res = await doRequest();
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
    apiFetch<ApiResp<AuthTokens>>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
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
  place: (body: { addressId: string; paymentMethod: string; notes?: string }) =>
    apiFetch<ApiResp<NcoleOrder>>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders: (page = 1, limit = 10) =>
    apiFetch<ListResp<NcoleOrder>>(`/orders/my?page=${page}&limit=${limit}`),
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
  updateMe: (body: { name?: string; phone?: string }) =>
    apiFetch<ApiResp<NcoleUser>>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
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

export const vendorProfileService = {
  getMyProfile: () => apiFetch<ApiResp<NcoleVendorProfile>>('/vendors/me'),
  updateProfile: (id: string, body: Partial<NcoleVendorProfile>) =>
    apiFetch<ApiResp<NcoleVendorProfile>>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const vendorProductsService = {
  list: (page = 1, limit = 20, vendorId?: string) =>
    apiFetch<ListResp<NcoleVendorProduct>>(`/products?page=${page}&limit=${limit}${vendorId ? `&vendorId=${vendorId}` : ''}`),
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResp<T> { success: boolean; data: T; }
export interface ListResp<T> { success: boolean; data: T[]; meta: ApiMeta; }
export interface ApiMeta { page: number; limit: number; total: number; totalPages: number; }
export interface AuthTokens { accessToken: string; refreshToken: string; }

export interface NcoleUser {
  id: string; email: string; name: string; phone?: string;
  role: string; isActive: boolean; createdAt: string;
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
  unitPrice: number; total: number;
}

export interface NcoleVendorOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod: string; subtotal: number; deliveryFee: number; total: number;
  createdAt: string; updatedAt: string; items: NcoleVendorOrderItem[];
}

export interface NcoleDeliveryAddress {
  street: string; district: string; city: string; fullName: string; phone: string;
}

export interface NcoleDeliveryItem {
  id: string; productName: string; quantity: number; unitPrice: number; total: number;
}

export interface NcoleDelivery {
  id: string; orderNumber: string; status: string; paymentMethod: string;
  subtotal: number; deliveryFee: number; total: number; notes?: string;
  createdAt: string; updatedAt: string;
  items: NcoleDeliveryItem[];
  address?: NcoleDeliveryAddress;
}
