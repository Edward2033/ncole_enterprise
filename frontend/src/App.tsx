import React, { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

// ── Layouts (eager — needed immediately on every route) ───────────────────────
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
import VendorLayout from '@/components/VendorLayout';
import RiderLayout from '@/components/RiderLayout';
import CustomerShell from '@/components/CustomerShell';

// ── Route guards (eager — tiny, always needed) ────────────────────────────────
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute from '@/routes/AdminRoute';
import VendorRoute from '@/routes/VendorRoute';
import RiderRoute from '@/routes/RiderRoute';

// ── AI (eager — floats on all public pages) ───────────────────────────────────
// Removed: PublicAiChat and WhatsAppButton are now handled by FloatingActionButtons
// inside each layout component to prevent duplicate floating buttons.

// ── Lazy page chunks ──────────────────────────────────────────────────────────
// Auth
const AuthPage          = lazy(() => import('@/pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const ApplyPage         = lazy(() => import('@/pages/ApplyPage'));

// Public storefront
const Home              = lazy(() => import('@/pages/Home'));
const ShopPage          = lazy(() => import('@/pages/ShopPage'));
const CategoryShopPage  = lazy(() => import('@/pages/CategoryShopPage'));
const ProductDetail     = lazy(() => import('@/pages/ProductDetail'));
const CollectionPage    = lazy(() => import('@/pages/CollectionPage'));
const NotFound          = lazy(() => import('@/pages/NotFound'));
const UnauthorizedPage  = lazy(() => import('@/pages/UnauthorizedPage'));

// Customer
const CartPage              = lazy(() => import('@/pages/CartPage'));
const Checkout              = lazy(() => import('@/pages/Checkout'));
const OrderConfirmation     = lazy(() => import('@/pages/OrderConfirmation'));
const OrdersPage            = lazy(() => import('@/pages/OrdersPage'));
const OrderDetailPage       = lazy(() => import('@/pages/OrderDetailPage'));
const TrackingPage          = lazy(() => import('@/pages/TrackingPage'));
const ProfilePage           = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage     = lazy(() => import('@/pages/NotificationsPage'));
const BillingPage           = lazy(() => import('@/pages/BillingPage'));
const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'));
const AddressesPage         = lazy(() => import('@/pages/customer/AddressesPage'));
const WishlistPage          = lazy(() => import('@/pages/WishlistPage'));

// Vendor
const VendorDashboardPage     = lazy(() => import('@/pages/vendor/VendorDashboardPage'));
const VendorProductsPage      = lazy(() => import('@/pages/vendor/VendorProductsPage'));
const VendorOrdersPage        = lazy(() => import('@/pages/vendor/VendorOrdersPage'));
const VendorAnalyticsPage     = lazy(() => import('@/pages/vendor/VendorAnalyticsPage'));
const VendorProfilePage       = lazy(() => import('@/pages/vendor/VendorProfilePage'));
const VendorNotificationsPage = lazy(() => import('@/pages/vendor/VendorNotificationsPage'));

// Rider
const RiderDashboardPage      = lazy(() => import('@/pages/rider/RiderDashboardPage'));
const RiderDeliveriesPage     = lazy(() => import('@/pages/rider/RiderDeliveriesPage'));
const RiderDeliveryDetailPage = lazy(() => import('@/pages/rider/RiderDeliveryDetailPage'));
const RiderEarningsPage       = lazy(() => import('@/pages/rider/RiderEarningsPage'));
const RiderProfilePage        = lazy(() => import('@/pages/rider/RiderProfilePage'));
const RiderNotificationsPage  = lazy(() => import('@/pages/rider/RiderNotificationsPage'));

// Admin
const AdminDashboardPage     = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminUsersPage         = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminVendorsPage       = lazy(() => import('@/pages/admin/AdminVendorsPage'));
const AdminProductsPage      = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminOrdersPage        = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminCategoriesPage    = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminBillingPage       = lazy(() => import('@/pages/admin/AdminBillingPage'));
const AdminRidersPage        = lazy(() => import('@/pages/admin/AdminRidersPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
const AdminAnalyticsPage     = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage      = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminActivityLogPage   = lazy(() => import('@/pages/admin/AdminActivityLogPage'));
const AdminAiSettingsPage    = lazy(() => import('@/pages/admin/AdminAiSettingsPage'));
const AdminApplicationsPage  = lazy(() => import('@/pages/admin/AdminApplicationsPage'));
const AdminSiteSettingsPage  = lazy(() => import('@/pages/admin/AdminSiteSettingsPage'));
const AdminTestimonialsPage  = lazy(() => import('@/pages/admin/AdminTestimonialsPage'));
const AdminProfilePage       = lazy(() => import('@/pages/admin/AdminProfilePage'));

// ── Page loading fallback ─────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <SiteSettingsProvider>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>

                  {/* ── Auth ─────────────────────────────────────────────── */}
                  <Route path="/login"          element={<AuthPage />} />
                  <Route path="/register"       element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/apply"          element={<ApplyPage />} />

                  {/* ── Vendor ───────────────────────────────────────────── */}
                  <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
                  <Route path="/vendor/dashboard"    element={<VendorRoute><VendorLayout><VendorDashboardPage /></VendorLayout></VendorRoute>} />
                  <Route path="/vendor/products"     element={<VendorRoute><VendorLayout><VendorProductsPage /></VendorLayout></VendorRoute>} />
                  <Route path="/vendor/orders"       element={<VendorRoute><VendorLayout><VendorOrdersPage /></VendorLayout></VendorRoute>} />
                  <Route path="/vendor/analytics"    element={<VendorRoute><VendorLayout><VendorAnalyticsPage /></VendorLayout></VendorRoute>} />
                  <Route path="/vendor/profile"      element={<VendorRoute><VendorLayout><VendorProfilePage /></VendorLayout></VendorRoute>} />
                  <Route path="/vendor/notifications" element={<VendorRoute><VendorLayout><VendorNotificationsPage /></VendorLayout></VendorRoute>} />

                  {/* ── Rider ────────────────────────────────────────────── */}
                  <Route path="/rider" element={<Navigate to="/rider/dashboard" replace />} />
                  <Route path="/rider/dashboard"      element={<RiderRoute><RiderLayout><RiderDashboardPage /></RiderLayout></RiderRoute>} />
                  <Route path="/rider/deliveries"     element={<RiderRoute><RiderLayout><RiderDeliveriesPage /></RiderLayout></RiderRoute>} />
                  <Route path="/rider/deliveries/:id" element={<RiderRoute><RiderLayout><RiderDeliveryDetailPage /></RiderLayout></RiderRoute>} />
                  <Route path="/rider/earnings"       element={<RiderRoute><RiderLayout><RiderEarningsPage /></RiderLayout></RiderRoute>} />
                  <Route path="/rider/profile"        element={<RiderRoute><RiderLayout><RiderProfilePage /></RiderLayout></RiderRoute>} />
                  <Route path="/rider/notifications"  element={<RiderRoute><RiderLayout><RiderNotificationsPage /></RiderLayout></RiderRoute>} />

                  {/* ── Admin ────────────────────────────────────────────── */}
                  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard"     element={<AdminDashboardPage />} />
                    <Route path="users"         element={<AdminUsersPage />} />
                    <Route path="vendors"       element={<AdminVendorsPage />} />
                    <Route path="products"      element={<AdminProductsPage />} />
                    <Route path="orders"        element={<AdminOrdersPage />} />
                    <Route path="categories"    element={<AdminCategoriesPage />} />
                    <Route path="billing"       element={<AdminBillingPage />} />
                    <Route path="riders"        element={<AdminRidersPage />} />
                    <Route path="notifications" element={<AdminNotificationsPage />} />
                    <Route path="analytics"     element={<AdminAnalyticsPage />} />
                    <Route path="settings"      element={<AdminSettingsPage />} />
                    <Route path="activity-log"   element={<AdminActivityLogPage />} />
                    <Route path="ai-settings"    element={<AdminAiSettingsPage />} />
                    <Route path="applications"   element={<AdminApplicationsPage />} />
                    <Route path="site-settings"  element={<AdminSiteSettingsPage />} />
                    <Route path="testimonials"    element={<AdminTestimonialsPage />} />
                    <Route path="profile"         element={<AdminProfilePage />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>

                  {/* ── Customer dashboard (protected, single CustomerShell wrap) ── */}
                  <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="/account"  element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="/customer/dashboard"    element={<ProtectedRoute><CustomerShell><CustomerDashboardPage /></CustomerShell></ProtectedRoute>} />
                  <Route path="/account/addresses"     element={<ProtectedRoute><CustomerShell><AddressesPage /></CustomerShell></ProtectedRoute>} />
                  <Route path="/account/orders"        element={<ProtectedRoute><CustomerShell><OrdersPage /></CustomerShell></ProtectedRoute>} />
                  <Route path="/account/profile"       element={<ProtectedRoute><CustomerShell><ProfilePage /></CustomerShell></ProtectedRoute>} />
                  <Route path="/account/notifications" element={<ProtectedRoute><CustomerShell><NotificationsPage /></CustomerShell></ProtectedRoute>} />
                  <Route path="/account/billing"       element={<ProtectedRoute><CustomerShell><BillingPage /></CustomerShell></ProtectedRoute>} />

                  {/* ── Public (Header + Footer + CartDrawer) ────────────── */}
                  <Route element={<Layout />}>
                    <Route path="/"                    element={<Home />} />
                    <Route path="/shop"                element={<ShopPage />} />
                    <Route path="/shop/category/:slug" element={<CategoryShopPage />} />
                    <Route path="/products/:handle"    element={<ProductDetail />} />
                    <Route path="/search"              element={<ShopPage />} />
                    <Route path="/collections/:handle" element={<CollectionPage />} />
                    <Route path="/unauthorized"        element={<UnauthorizedPage />} />

                    <Route path="/cart"     element={<CartPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

                    <Route path="/orders"                   element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                    <Route path="/order/:id"                element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                    <Route path="/order-confirmation/:id"   element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                    <Route path="/tracking/:orderId"        element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />

                    <Route path="/account/profile"       element={<Navigate to="/account/profile" replace />} />
                    <Route path="/account/orders"        element={<Navigate to="/account/orders" replace />} />
                    <Route path="/account/notifications" element={<Navigate to="/account/notifications" replace />} />
                    <Route path="/account/billing"       element={<Navigate to="/account/billing" replace />} />

                    {/* Legacy aliases */}
                    <Route path="/profile"         element={<ProtectedRoute><Navigate to="/account/profile" replace /></ProtectedRoute>} />
                    <Route path="/notifications"   element={<ProtectedRoute><Navigate to="/account/notifications" replace /></ProtectedRoute>} />
                    <Route path="/billing"         element={<ProtectedRoute><Navigate to="/account/billing" replace /></ProtectedRoute>} />
                    <Route path="/payment-history" element={<ProtectedRoute><Navigate to="/account/billing" replace /></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Route>

                </Routes>
              </Suspense>

              {/* Floating buttons are now handled per-layout via FloatingActionButtons */}

            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
    </SiteSettingsProvider>
  </ThemeProvider>
);

export default App;
