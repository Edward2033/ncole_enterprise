# N_COLE Interpress — Enterprise Multi-Vendor Marketplace

[![CI](https://github.com/Edward2033/ncole_enterprise/actions/workflows/ci.yml/badge.svg)](https://github.com/Edward2033/ncole_enterprise/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A production-grade, AI-powered multi-vendor e-commerce marketplace built for Rwanda and the wider African market.

**Course:** EWA408510 – E-Commerce and Web Application | UNILAK | Academic Year 2025-2026
**Student:** Edward Y. Cole | **Instructor:** Eric Maniraguha
**GitHub:** https://github.com/Edward2033/ncole_enterprise
**Live App:** https://ncoleinterpress.com | **API:** https://api.ncoleinterpress.com/health

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Installation & Local Development](#6-installation--local-development)
7. [Environment Configuration](#7-environment-configuration)
8. [Docker Usage](#8-docker-usage)
9. [Deployment](#9-deployment)
10. [API Reference](#10-api-reference)
11. [Security Features](#11-security-features)
12. [AI Assistant](#12-ai-assistant)
13. [Billing & Payments](#13-billing--payments)
14. [Notifications](#14-notifications)
15. [Exam Compliance — EWA408510](#15-exam-compliance--ewa408510)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

N_COLE Interpress is a full-stack enterprise e-commerce platform featuring:
- Multi-vendor marketplace with vendor onboarding and product management
- Customer shopping experience with cart, checkout, and order tracking
- Delivery rider management and real-time status updates
- Enterprise billing system with invoice generation and payment verification
- Google Gemini 2.0 Flash AI assistant across all five portals
- Complete admin dashboard with analytics, audit logging, and reporting

**Repository:** https://github.com/Edward2033/ncole_enterprise

**Live URLs (production):**
| Portal | URL |
|--------|-----|
| Storefront | https://ncoleinterpress.com |
| Customer Portal | https://app.ncoleinterpress.com |
| Vendor Portal | https://vendors.ncoleinterpress.com |
| Admin Portal | https://admin.ncoleinterpress.com |
| Rider Portal | https://rider.ncoleinterpress.com |
| API | https://api.ncoleinterpress.com |

---

## 2. Features

### Customer Features
- Browse products by category, search, and filter
- Shopping cart with variant support
- Order placement and real-time status tracking
- Invoice viewing and payment submission (MTN MoMo, Airtel Money)
- Address management and delivery tracking
- In-app notification centre with preferences
- AI assistant for order help and product recommendations

### Vendor Features
- Product management with variants, images, and SKU tracking
- Order management and fulfilment workflow
- Sales analytics and revenue reports
- AI assistant for inventory and performance insights

### Admin Features
- Full platform management: users, vendors, products, orders
- Payment verification and revenue reporting
- Category management and platform settings
- Maintenance mode toggle
- Broadcast notifications
- AI-powered analytics assistant
- Audit activity log

### Rider Features
- Assigned delivery management
- Status update workflow
- Earnings overview
- AI delivery guidance assistant

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express, TypeScript |
| Database | PostgreSQL 16 (Supabase), Prisma ORM |
| Auth | JWT (access + refresh token rotation) |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Frontend | React 18, TypeScript, Vite |
| UI Components | shadcn/ui, Tailwind CSS |
| State / Context | React Context API |
| Validation | Zod |
| Containerisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render (backend), Vercel (frontend) |
| Reverse Proxy | Nginx |
| Logging | Winston |
| Image Storage | Cloudinary |
| Payments | MTN MoMo, Airtel Money, Stripe (ready) |

---

## 4. Architecture

```
Internet
   │
   ▼
Nginx (Reverse Proxy)
   ├── /             ──── Storefront (React/Vite)
   ├── /api/v1       ──── Backend API (Express)
   └── static assets ──── Served by Nginx

Backend API
   ├── PostgreSQL via Supabase (Prisma ORM)
   └── Google Gemini 2.0 Flash (AI — context pre-aggregated, DB never exposed)
```

---

## 5. Project Structure

```
N_cole/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + type-check on every push
│       └── deploy.yml              # Deploy to Render + Vercel on main
│
├── backend/                        # Express API — all business logic
│   ├── prisma/
│   │   ├── schema.prisma           # Full DB schema (15 models)
│   │   └── seed.ts                 # Dev seed data
│   └── src/
│       ├── config/
│       │   ├── database.ts         # Prisma client singleton
│       │   ├── env.ts              # Zod-validated environment config
│       │   └── logger.ts           # Winston logger
│       ├── middleware/
│       │   ├── authenticate.ts     # JWT Bearer token verification
│       │   ├── authorize.ts        # RBAC role enforcement
│       │   ├── errorHandler.ts     # Global error handler
│       │   ├── rateLimiter.ts      # express-rate-limit config
│       │   └── validate.ts         # Zod request body validation
│       ├── modules/
│       │   ├── addresses/          # Address CRUD
│       │   ├── ai/
│       │   │   ├── ai.context.ts   # DB context builder (per portal)
│       │   │   ├── ai.controller.ts
│       │   │   ├── ai.prompts.ts   # Role-scoped system prompts
│       │   │   ├── ai.routes.ts    # POST /api/v1/ai/chat
│       │   │   └── ai.service.ts   # Gemini 2.0 Flash integration
│       │   ├── auth/               # Register, login, refresh, logout, password reset
│       │   ├── billing/            # Invoices & payments
│       │   ├── cart/               # Cart + cart items
│       │   ├── categories/         # Product categories (nested)
│       │   ├── notifications/      # In-app notifications + preferences
│       │   ├── orders/             # Order placement & status management
│       │   ├── products/
│       │   │   ├── products.controller.ts
│       │   │   ├── products.routes.ts
│       │   │   ├── products.service.ts
│       │   │   └── upload.routes.ts  # POST /products/upload-image (Cloudinary)
│       │   ├── riders/             # Rider delivery routes
│       │   ├── settings/           # Platform settings + maintenance mode
│       │   ├── users/              # User profile, admin user management
│       │   └── vendors/            # Vendor profiles + backfill
│       └── shared/
│           ├── errors/
│           │   └── AppError.ts     # Typed HTTP error class
│           ├── types/
│           │   └── express.d.ts    # req.user type augmentation
│           └── utils/
│               ├── audit.ts        # Fire-and-forget activity logging
│               ├── email.ts        # Resend SDK email helper
│               ├── hash.ts         # bcrypt helpers
│               ├── jwt.ts          # sign / verify JWT
│               └── response.ts     # sendSuccess / sendError helpers
│   ├── app.ts                      # Express app setup (routes, middleware)
│   ├── server.ts                   # Entry point (dotenv, DB connect, listen)
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Unified React frontend (all portals)
│   ├── public/
│   │   └── robots.txt
│   └── src/
│       ├── components/
│       │   ├── admin/              # AdminBadge, AdminModal, AdminSearch, AdminTable
│       │   ├── ui/                 # shadcn/ui component library
│       │   ├── AdminLayout.tsx
│       │   ├── AppLayout.tsx
│       │   ├── AuthPromptModal.tsx
│       │   ├── CartDrawer.tsx
│       │   ├── CustomerShell.tsx
│       │   ├── Footer.tsx
│       │   ├── Header.tsx
│       │   ├── Hero.tsx
│       │   ├── Layout.tsx
│       │   ├── ProductCard.tsx
│       │   ├── ProductGrid.tsx
│       │   ├── RiderLayout.tsx
│       │   ├── theme-provider.tsx
│       │   └── VendorLayout.tsx
│       ├── contexts/
│       │   ├── AppContext.tsx
│       │   ├── AuthContext.tsx
│       │   └── CartContext.tsx
│       ├── features/
│       │   └── ai/
│       │       ├── aiApi.ts        # apiFetch wrapper for POST /ai/chat
│       │       ├── AiChat.tsx      # Portal-aware floating chat widget
│       │       └── PublicAiChat.tsx # Public storefront chat widget
│       ├── hooks/
│       │   ├── use-mobile.tsx
│       │   ├── use-toast.ts
│       │   ├── useAuthGuard.ts
│       │   └── useProducts.ts
│       ├── lib/
│       │   ├── adminFormat.ts
│       │   ├── format.ts
│       │   ├── types.ts
│       │   └── utils.ts
│       ├── pages/
│       │   ├── admin/              # AdminActivityLogPage, AdminAnalyticsPage, AdminBillingPage ...
│       │   ├── customer/           # CustomerDashboardPage, AddressesPage
│       │   ├── rider/              # RiderDashboardPage, RiderDeliveriesPage, RiderEarningsPage ...
│       │   ├── vendor/             # VendorDashboardPage, VendorProductsPage, VendorOrdersPage ...
│       │   ├── Home.tsx            # Storefront landing page
│       │   ├── ShopPage.tsx
│       │   ├── ProductDetail.tsx
│       │   ├── CartPage.tsx
│       │   ├── Checkout.tsx
│       │   ├── OrdersPage.tsx
│       │   ├── BillingPage.tsx
│       │   ├── AuthPage.tsx
│       │   └── ...
│       ├── routes/
│       │   ├── AdminRoute.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── RiderRoute.tsx
│       │   └── VendorRoute.tsx
│       ├── services/
│       │   ├── api.ts              # apiFetch + all typed service helpers
│       │   └── adminApi.ts         # Admin-specific API calls
│       ├── App.tsx
│       └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf                  # Frontend Nginx config (SPA fallback)
│   ├── .env                        # VITE_API_URL=http://localhost:4000/api/v1
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── nginx/
│   └── default.conf                # Reverse proxy config
│
├── scripts/
│   ├── init.sql                    # DB initialisation script
│   ├── backup.sh
│   └── restore.sh
│
├── docs/
│   ├── API.md                      # Full API request/response examples
│   ├── DATABASE.md                 # Schema documentation
│   ├── DEVOPS.md                   # Docker & deployment guide
│   ├── ACADEMIC_REPORT.md
│   └── ORAL_DEFENSE.md
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 6. Installation & Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Supabase project)
- Docker & Docker Compose (optional)

### Quick Start (without Docker)

```bash
# 1. Clone the repository
git clone https://github.com/Edward2033/ncole_enterprise.git
cd ncole_enterprise

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, DIRECT_URL, JWT secrets, GEMINI_API_KEY
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
# API running at http://localhost:4000

# 3. Setup frontend (new terminal)
cd ../frontend
# Create .env with: VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev
# Storefront at http://localhost:5173
```

---

## 7. Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL pooler connection string (Supabase port 6543) | Yes |
| `DIRECT_URL` | PostgreSQL direct connection for migrations (port 5432) | Yes |
| `ACCESS_TOKEN_SECRET` | JWT secret (min 32 chars) | Yes |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret (min 32 chars) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (from aistudio.google.com) | Yes (for AI) |
| `GEMINI_MODEL` | Gemini model name. Default: `gemini-2.0-flash` | No |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | Yes |
| `CLOUDINARY_*` | Cloudinary credentials for image uploads | Optional |
| `MOMO_*` | MTN MoMo payment credentials | Optional |
| `AIRTEL_*` | Airtel Money credentials | Optional |
| `RESEND_API_KEY` | Resend API key for transactional emails | Optional |
| `EMAIL_FROM` | Sender address (use `onboarding@resend.dev` for testing) | Yes |
| `EMAIL_REPLY_TO` | Reply-to address | Optional |

Frontend `.env`:
```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 8. Docker Usage

### Development
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
docker-compose down
```

### Production
```bash
cp backend/.env.example .env.production
# Edit .env.production

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose logs -f backend
docker-compose exec backend npx prisma migrate deploy
```

### Service URLs (Docker dev)
| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Frontend | http://localhost:5173 |
| Nginx | http://localhost:8080 |

---

## 9. Deployment

### Backend → Render
1. Create a Web Service on [render.com](https://render.com)
2. Root directory: `backend/`
3. Build command: `npm ci && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/server.js`
5. Add all environment variables from `backend/.env.example`

### Frontend → Vercel
1. Import the `frontend/` folder as a Vercel project
2. Set `VITE_API_URL=https://your-backend.onrender.com/api/v1`

### CI/CD Secrets (GitHub → Settings → Secrets)
```
RENDER_API_KEY, RENDER_SERVICE_ID, BACKEND_URL
VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
VITE_API_URL, PRODUCTION_DATABASE_URL
```

---

## 10. API Reference

Base URL: `http://localhost:4000/api/v1` (dev) · `https://api.ncoleinterpress.com/api/v1` (prod)

| Module | Key Endpoints |
|--------|--------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Users | `GET /users/me`, `PATCH /users/me`, `POST /users/me/change-password`, `GET /users` (admin), `POST /users` (admin), `PATCH /users/:id` (admin) |
| Products | `GET /products`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`, `POST /products/upload-image` |
| Categories | `GET /categories`, `POST /categories`, `PATCH /categories/:id` |
| Vendors | `GET /vendors`, `GET /vendors/me`, `GET /vendors/:id`, `PATCH /vendors/:id`, `POST /vendors/backfill` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` |
| Orders | `POST /orders`, `GET /orders/my`, `GET /orders/vendor`, `GET /orders/rider`, `GET /orders` (admin), `PATCH /orders/:id/status` |
| Addresses | `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id` |
| Billing | `GET /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/invoices/:id/pay`, `GET /billing/payments` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`, `GET /notifications/preferences`, `PATCH /notifications/preferences` |
| Riders | `GET /riders`, `PATCH /riders/:id` |
| Settings | `GET /settings/maintenance`, `PATCH /settings/maintenance` |
| AI | `POST /ai/chat` |

See `docs/API.md` for full request/response examples.

---

## 11. Security Features

- **JWT**: Short-lived access tokens (15m) + refresh token rotation
- **RBAC**: Role-based access control on every protected route (`ADMIN`, `VENDOR`, `CUSTOMER`, `RIDER`)
- **Rate Limiting**: Global 200 req/15min, auth endpoints 20 req/15min
- **Helmet**: Security headers on all responses
- **CORS**: Strict origin whitelist via `CORS_ORIGIN`
- **Input Validation**: Zod schemas on all endpoints — invalid bodies rejected with 400
- **SQL Injection Prevention**: Prisma parameterised queries — no raw SQL
- **Password Hashing**: bcrypt with salt rounds
- **Non-root Containers**: All Docker containers run as UID 1001
- **Audit Logging**: Sensitive actions logged to `activity_logs` table via fire-and-forget `audit()` util

---

## 12. AI Assistant

Powered by **Google Gemini 2.0 Flash** via `@google/generative-ai`. Each portal has a role-scoped assistant with live DB context injected into the system prompt.

| Portal | System Prompt Scope | DB Context Injected |
|--------|--------------------|--------------------|
| Public | Shopping assistant, product discovery | Product count, category list |
| Customer | Order/invoice/delivery explanation | Last 5 orders, last 3 invoices |
| Vendor | Sales insights, inventory management | Revenue, low stock, top products |
| Rider | Delivery guidance, status transitions | Assigned orders, delivery stats |
| Admin | Revenue & platform analytics | Full platform snapshot |

**Implementation:**
- `ai.prompts.ts` — role-scoped system instruction factory
- `ai.context.ts` — DB aggregation per portal (Gemini never touches DB directly)
- `ai.service.ts` — Gemini client, multi-turn history, smart 429 handling
- `ai.routes.ts` — `POST /api/v1/ai/chat` (public portal: no auth; others: Bearer required)

**Error handling:**
- Daily free-tier quota exhausted → user-friendly message, no 500
- Per-minute rate limit → retry-in message extracted from API response
- All Gemini errors logged via Winston before returning typed `AppError`

---

## 13. Billing & Payments

Invoice format: `INV-2026-000001`
Payment reference: `PAY-2026-000001`

**Workflow:** Order Created → Invoice Auto-Generated → Customer Submits Payment → Admin Verifies → Completed

Supported gateways: MTN MoMo, Airtel Money, Stripe, Manual (Cash on Delivery).

---

## 14. Notifications

- In-app notification centre on all portals
- Auto-triggered on: order created, order status changes, payment status changes, vendor approval, rider assignment
- Per-user preferences: toggle `inApp`, `email`, `orderUpdates`, `promotions`

---

## 15. Exam Compliance — EWA408510

This project satisfies all assessment criteria for the UNILAK EWA408510 Final Examination:

| Requirement | Implementation | Marks |
|-------------|---------------|-------|
| **UI/UX** — Responsive, professional, mobile-friendly | Tailwind CSS + shadcn/ui, hero, nav, category grid, product cards | 5 |
| **Product Management** — Listing, detail, categories, search/filter | `ShopPage.tsx`, `ProductDetail.tsx`, `CategoryShopPage.tsx`, `/products` API | 4 |
| **Shopping Cart** — Add, remove, update qty, auto totals | `CartContext.tsx`, `CartPage.tsx`, `CartDrawer.tsx` | 4 |
| **Checkout** — Address, order summary, validation, confirmation | `Checkout.tsx`, `OrderConfirmation.tsx`, `/orders` API | 4 |
| **Database** — Products, customers, orders, relationships | PostgreSQL + Prisma, 15 models in `schema.prisma` | 5 |
| **GitHub** — Repo, commit history, README | https://github.com/Edward2033/ncole_enterprise | 3 |
| **Deployment** — Live and accessible | https://ncoleinterpress.com + https://api.ncoleinterpress.com | 3 |
| **CI/CD** — Automated build, test, deploy | `.github/workflows/ci.yml` + `deploy.yml` | 4 |
| **Docker** — Dockerfile, docker-compose, running containers | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | 4 |
| **Presentation** | Live demo, architecture explanation, Q&A | 4 |
| **TOTAL** | | **40** |

**Innovation Bonus Features (up to +5):**
- AI-Powered Assistant — Google Gemini 2.0 Flash across 5 portals
- Payment Gateway Integration — MTN MoMo, Airtel Money, Cash on Delivery
- Analytics Dashboard — Vendor sales analytics, Admin platform analytics
- Multi-Vendor Marketplace — Vendors, products, order routing per vendor
- Real-Time Notifications — In-app notification centre with preferences
- Advanced Security — JWT rotation, RBAC, audit logging, bcrypt, non-root Docker

---

## 16. Troubleshooting

**Backend won't start:** Check `DATABASE_URL` is correct and the Supabase project is reachable.

**Prisma migration errors:** Run `npx prisma migrate reset` (dev only — destroys data).

**Applications / OTP 500 errors:** The `applications` and `otp_codes` tables must be created manually in Supabase before the Applications and OTP features will work. Run `apply.db.sql` in your Supabase project:
1. Open [supabase.com](https://supabase.com) → your project → **SQL Editor** → **New Query**
2. Paste the full contents of `apply.db.sql` (root of the repository)
3. Click **Run**
4. Confirm the query completes with no errors

This only needs to be done once per Supabase project. It is safe to re-run — all statements use `IF NOT EXISTS` guards.

**CORS errors:** Ensure `CORS_ORIGIN` in `backend/.env` includes all frontend origins, comma-separated.

**AI returns "daily limit" message:** The free Gemini tier daily quota is exhausted. It resets at midnight Pacific time. Enable billing at [aistudio.google.com](https://aistudio.google.com) to remove the cap.

**AI returns "busy" message:** Per-minute rate limit hit — wait the indicated seconds and retry.

**Image upload fails:** Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env`.

**Docker containers exit immediately:** Run `docker-compose logs <service>` to inspect startup errors.
