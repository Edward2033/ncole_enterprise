import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { globalRateLimiter } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';
import { verifyAccessToken } from '@/shared/utils/jwt';

import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import categoriesRoutes from '@/modules/categories/categories.routes';
import productsRoutes from '@/modules/products/products.routes';
import vendorsRoutes from '@/modules/vendors/vendors.routes';
import cartRoutes from '@/modules/cart/cart.routes';
import ordersRoutes from '@/modules/orders/orders.routes';
import addressesRoutes from '@/modules/addresses/addresses.routes';
import notificationsRoutes from '@/modules/notifications/notifications.routes';
import billingRoutes from '@/modules/billing/billing.routes';
import aiRoutes from '@/modules/ai/ai.routes';
import ridersRoutes from '@/modules/riders/riders.routes';
import settingsRoutes from '@/modules/settings/settings.routes';
import applicationsRoutes from '@/modules/applications/applications.routes';
import uploadRoutes from '@/modules/products/upload.routes';
import wishlistRoutes from '@/modules/wishlist/wishlist.routes';
import reviewsRoutes from '@/modules/reviews/reviews.routes';

import { prisma } from '@/config/database';
import { getMaintenanceConfig } from '@/modules/settings/settings.service';

const app = express();

// Trust exactly one proxy hop (Render load balancer).
// Required so express-rate-limit reads the real client IP from X-Forwarded-For.
// Must NOT be `true` — that would allow IP spoofing and triggers ERR_ERL_PERMISSIVE_TRUST_PROXY.
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

// CORS: ensure exactly ONE Access-Control-Allow-Origin header.
// Dynamically reflect the requesting origin only if it is explicitly allowed.
app.use(
  cors({
    credentials: true,
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      const allowed = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

      // Exact match
      if (allowed.includes(requestOrigin)) return callback(null, requestOrigin);

      // Allow any Vercel preview deployment for this project
      if (/^https:\/\/ncole-enterprise[a-z0-9-]*\.vercel\.app$/.test(requestOrigin)) {
        return callback(null, requestOrigin);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
  })
);

app.use(globalRateLimiter);


// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: () => env.NODE_ENV === 'test',
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────
const prefix = env.API_PREFIX;

// ─── Maintenance mode middleware ─────────────────────────────────────────────
// Runs after auth parsing so ADMIN/VENDOR/RIDER bypass can work.
// Non-blocking: if settings DB call fails, maintenance is treated as disabled.
app.use(async (req, res, next) => {
  // Always allow: health check, auth endpoints, settings read
  const alwaysAllow = [
    '/health',
    `${prefix}/auth`,
    `${prefix}/settings/maintenance`, // public maintenance status check
  ];
  if (alwaysAllow.some(p => req.path.startsWith(p))) return next();

  let config;
  try { config = await getMaintenanceConfig(); } catch { return next(); }
  if (!config.enabled) return next();

  // Decode token to check role (non-blocking — ignore invalid tokens)
  let role: string | undefined;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { role = verifyAccessToken(header.slice(7)).role; } catch { /* ignore */ }
  }

  if (role === 'ADMIN' && config.allowAdmins) return next();
  if (role === 'VENDOR' && config.allowVendors) return next();
  if (role === 'RIDER' && config.allowRiders) return next();

  res.status(503).json({
    success: false,
    maintenance: true,
    error: config.message || 'The platform is currently under maintenance. Please check back soon.',
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Public stats (real counts for storefront) ───────────────────────────────
app.get(`${prefix}/stats`, async (_req, res) => {
  try {
    const [vendors, products, customers, orders] = await Promise.all([
      prisma.vendor.count({ where: { isVerified: true, isActive: true } }),
      prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.customer.count(),
      prisma.order.count({ where: { status: 'DELIVERED', deletedAt: null } }),
    ]);
    res.json({ success: true, data: { vendors, products, customers, orders } });
  } catch { res.json({ success: true, data: { vendors: 0, products: 0, customers: 0, orders: 0 } }); }
});

app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/users`, usersRoutes);
app.use(`${prefix}/categories`, categoriesRoutes);
// Image upload must be registered BEFORE the generic products router
// so POST /products/upload-image is matched first
app.use(`${prefix}/products`, uploadRoutes);
app.use(`${prefix}/products`, productsRoutes);
app.use(`${prefix}/vendors`, vendorsRoutes);
app.use(`${prefix}/cart`, cartRoutes);
app.use(`${prefix}/orders`, ordersRoutes);
app.use(`${prefix}/addresses`, addressesRoutes);
app.use(`${prefix}/notifications`, notificationsRoutes);
app.use(`${prefix}/billing`, billingRoutes);
app.use(`${prefix}/ai`, aiRoutes);
app.use(`${prefix}/riders`, ridersRoutes);
app.use(`${prefix}/applications`, applicationsRoutes);
app.use(`${prefix}/wishlist`, wishlistRoutes);
app.use(`${prefix}/products/:productId/reviews`, reviewsRoutes);
app.use(`${prefix}/settings`, settingsRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
