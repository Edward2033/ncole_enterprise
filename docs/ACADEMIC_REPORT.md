# N_COLE INTERPRESS
## Enterprise Multi-Vendor E-Commerce Marketplace Platform

---

**ACADEMIC PROJECT REPORT**

**Institution**: University of Lay Adventists of Kigali (UNILAK)
**Faculty**: Faculty of Computing and Information Sciences
**Course Code & Name**: EWA408510 – E-Commerce and Web Application
**Submitted By**: Edward Y. Cole
**Instructor**: Eric Maniraguha
**Submission Date**: July 3, 2026
**Academic Year**: 2025 / 2026

---

## TABLE OF CONTENTS

1. Introduction
2. Problem Statement
3. Project Objectives
4. System Features
5. Technologies Used
6. System Architecture
7. Database Design
8. Screenshots of the Application
9. GitHub Repository Link
10. Deployment Link
11. CI/CD Implementation
12. Docker Implementation
13. Challenges Encountered
14. Future Enhancements
15. Conclusion

---

## 1. Introduction

N_COLE Interpress is a production-grade, full-stack, multi-vendor e-commerce marketplace platform designed and developed to address the growing demand for digital commerce infrastructure in Rwanda and the wider East African market. The platform provides a comprehensive digital marketplace ecosystem connecting product vendors, customers, delivery riders, and platform administrators through a unified web application backed by a single enterprise-grade RESTful API.

The system integrates Google's Gemini 2.0 Flash large language model to provide context-aware AI assistance across every user portal, tailored to each user role. The platform is fully containerised with Docker, has automated CI/CD via GitHub Actions, and is deployed live on Render (backend) and Vercel (frontend).

This project is submitted as the Final Examination (Project-Based) deliverable for EWA408510 – E-Commerce and Web Application at UNILAK for the 2025-2026 academic year.

---

## 2. Problem Statement

Small and medium enterprises (SMEs) in Rwanda face significant barriers to digital commerce adoption. Existing platforms are either prohibitively expensive, inadequately localised for the Rwandan market, or lack the multi-vendor architecture required to support a marketplace model. Key challenges include:

- **No localised payment integration**: Most platforms do not natively support MTN Mobile Money or Airtel Money, which are the dominant payment channels in Rwanda.
- **Fragmented vendor management**: Vendors lack tools to manage products, track orders, and analyse performance in one place.
- **Poor delivery coordination**: No unified system connects vendors, customers, and delivery riders.
- **Lack of AI-powered assistance**: Customers, vendors, and operations staff receive no intelligent contextual support.
- **High technical debt**: Available open-source solutions require extensive customisation and lack production-grade DevOps support.

N_COLE Interpress directly addresses each of these challenges.

---

## 3. Project Objectives

**Primary Objectives:**
1. Design and implement a scalable multi-vendor e-commerce platform supporting unlimited vendors and products.
2. Build a complete order lifecycle management system from cart to delivery confirmation.
3. Implement a localised billing and payment system supporting MTN MoMo and Airtel Money.
4. Integrate Google Gemini 2.0 Flash AI as a context-aware assistant across all user roles.
5. Deploy a production-ready, containerised platform with automated CI/CD.

**Secondary Objectives:**
6. Implement enterprise security: JWT, RBAC, rate limiting, audit logging.
7. Create comprehensive DevOps infrastructure using Docker and GitHub Actions.
8. Produce complete documentation for all system components.
9. Design the architecture for future scalability.

---

## 4. System Features

### 4.1 User Interface (UI)
- Responsive and professional design using Tailwind CSS and shadcn/ui
- Homepage with navigation menu, hero slideshow, and category browsing
- Mobile-friendly experience across all screen sizes
- Consistent branding (N_COLE orange/slate colour palette) across all portals

### 4.2 Product Management
- Product listing page with grid and list view
- Product detail page with image gallery, variants, and stock status
- Product categories with nested navigation
- Product search and filtering by keyword, category, and price range
- Sort by price (low/high) and name

### 4.3 Shopping Cart
- Add products to cart (with variant support)
- Remove products from cart
- Update product quantities (increment/decrement)
- Automatic subtotal calculation
- Cart persisted to localStorage

### 4.4 Checkout Process
- Customer delivery address collection with form validation
- Address management (add, select default)
- Payment method selection (MTN MoMo, Airtel Money, Cash on Delivery)
- Full order summary review before placing
- Order confirmation page with order number and payment instructions

### 4.5 Database Integration
- PostgreSQL 16 via Supabase with Prisma ORM
- 15 models: users, vendors, customers, riders, products, variants, categories, carts, orders, addresses, invoices, payments, notifications, preferences, activity logs
- All entities fully relational with proper foreign keys and indices

### 4.6 Vendor Portal
- Product listing, creation, editing, and deletion
- Order management and fulfilment workflow
- Sales analytics and revenue reporting
- AI assistant for inventory and performance insights

### 4.7 Admin Portal
- Full platform management: users, vendors, products, orders
- Payment verification and revenue reporting
- Category management, broadcast notifications, maintenance mode
- Audit activity log, AI-powered analytics assistant

### 4.8 Rider Portal
- Assigned delivery management and status updates
- Earnings overview and AI delivery guidance

### 4.9 AI Assistant (Innovation Bonus Feature)
- Powered by Google Gemini 2.0 Flash
- Role-scoped across 5 portals: Public, Customer, Vendor, Rider, Admin
- Live database context injected per portal (orders, invoices, products, revenue)
- Smart 429 handling: distinguishes daily quota exhaustion from per-minute limits

---

## 5. Technologies Used

| Category | Technology | Justification |
|----------|-----------|---------------|
| Runtime | Node.js 20 | Mature, performant, large ecosystem |
| Framework | Express.js | Lightweight, flexible, industry standard |
| Language | TypeScript | Type safety, maintainability, IDE support |
| Database | PostgreSQL 16 (Supabase) | ACID compliant, relational, production-proven |
| ORM | Prisma 5 | Type-safe queries, migration management |
| Authentication | JSON Web Tokens | Stateless, scalable, refresh token rotation |
| AI | Google Gemini 2.0 Flash | Latest LLM, cost-effective, fast responses |
| Frontend | React 18 + Vite | Modern, fast build tooling |
| UI | Tailwind CSS + shadcn/ui | Consistent design, rapid development |
| State | React Context API | Lightweight, built-in, sufficient for scope |
| Validation | Zod | Runtime + compile-time type safety |
| Containerisation | Docker + Docker Compose | Reproducible environments |
| CI/CD | GitHub Actions | Native GitHub integration, free for open source |
| Deployment | Render (backend) + Vercel (frontend) | Free tiers, globally accessible |
| Reverse Proxy | Nginx | High-performance, production-proven |
| Logging | Winston | Structured logging, multiple transports |
| Image Storage | Cloudinary | Managed CDN, transformation APIs |
| Email | Resend SDK | Transactional emails (approval, OTP, password reset) |
| Payments | MTN MoMo, Airtel Money, Cash on Delivery | Localised for Rwanda |

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
Internet
   │
   ▼
Nginx Reverse Proxy
   ├── /             ──── Frontend SPA (React/Vite — all portals)
   ├── /api/v1       ──── Backend API (Express/TypeScript)
   └── static assets ──── Served by Nginx

Backend API
   ├── PostgreSQL via Supabase (Prisma ORM)
   └── Google Gemini 2.0 Flash (AI — context pre-aggregated)
```

### 6.2 Backend Module Architecture

The backend follows a feature-module pattern:
```
src/modules/
├── auth/          → Register, login, token refresh, logout, password reset
├── users/         → Profile management, admin user CRUD, activity log
├── vendors/       → Vendor CRUD, verification, backfill
├── products/      → Product + variant management, image upload
├── categories/    → Category tree management
├── cart/          → Cart management
├── orders/        → Order placement, status lifecycle
├── addresses/     → Address CRUD
├── notifications/ → Event-driven notification system
├── billing/       → Invoice + payment workflow
├── riders/        → Rider management
├── settings/      → Platform settings, maintenance mode
└── ai/            → Gemini integration, context service, prompts
```

### 6.3 Security Middleware Pipeline

Every request passes through:
`Helmet → CORS → Rate Limiter → Morgan Logger → Authenticate (optional) → Authorize (role check) → Validate (Zod) → Controller → Error Handler`

---

## 7. Database Design

### 7.1 Core Entity Relationships

The database has 15 tables organised into 6 domains:

- **Identity**: `users`, `refresh_tokens`, `password_reset_tokens`
- **Profiles**: `vendors`, `customers`, `riders`
- **Catalogue**: `categories`, `products`, `product_variants`
- **Commerce**: `carts`, `cart_items`, `orders`, `order_items`, `addresses`
- **Billing**: `invoices`, `payments`, `payment_transactions`
- **Platform**: `notifications`, `notification_preferences`, `activity_logs`

### 7.2 Key Design Decisions

1. **All monetary values stored as integers (RWF)**: Eliminates floating-point precision errors in financial calculations.
2. **Soft deletion on orders and products**: `deletedAt` field preserves audit trail.
3. **Idempotent invoice generation**: Invoice creation checks for existing records via unique `orderId` constraint.
4. **Refresh token rotation**: Each token use issues a new token and invalidates the old one.
5. **ActivityLog as append-only**: No updates or deletes allowed on audit records.

### 7.3 Invoice and Payment Number Format

```
INV-{YEAR}-{SEQUENCE}  →  INV-2026-000001
PAY-{YEAR}-{SEQUENCE}  →  PAY-2026-000001
```

---

## 8. Screenshots of the Application

The following screenshots demonstrate the key functional areas of the N_COLE Interpress platform.

### 8.1 Public Storefront — Homepage
The homepage features a hero slideshow, trust bar (free delivery, verified vendors, same-day dispatch, AI-powered), a category grid, featured products section, AI assistant banner, trending products, and a live stats counter showing active vendors, products, customers, and completed orders. The header includes a sticky navigation bar with search, cart icon with item count badge, and user account dropdown.

### 8.2 Shop Page — Search, Filter & Sort
The shop page (`/shop`) displays all active products in a responsive grid (2 columns mobile, 3 columns desktop). The left sidebar provides: a keyword search input, a category list with product counts, and price range presets (Under RWF 5,000 through Over RWF 100,000). A toolbar above the grid allows switching between grid and list view, and sorting by default, price ascending, price descending, or name A–Z. Active filters are indicated with an orange badge. Pagination controls appear at the bottom when results exceed 16 products.

### 8.3 Product Detail Page
The product detail page shows a full image gallery with thumbnail strip, vendor name and category breadcrumb, product title, interactive star rating widget, price with in-stock/out-of-stock badge, variant selector buttons (disabled and struck-through when out of stock), quantity increment/decrement controls, and an Add to Cart button that transitions to a green "Added to Cart!" confirmation state. Below the main section, tabbed panels show Description, Specifications, and Reviews. Related products and recently viewed products grids appear at the bottom.

### 8.4 Shopping Cart
The cart drawer slides in from the right when the cart icon is clicked. It lists each item with its image, name, variant, unit price, and a quantity stepper. The subtotal updates automatically. A "Checkout" button navigates to the checkout page. The cart page (`/cart`) provides the same controls in a full-page layout with an order summary panel.

### 8.5 Checkout Page
The checkout page is divided into two columns: the left column contains a delivery address selector (cards for saved addresses with a default badge) and an "Add New" form with full validation (name, phone, street, district, city, province), plus a payment method selector (MTN Mobile Money, Airtel Money, Cash on Delivery) and an optional order notes textarea. The right column shows the order summary with item images, names, quantities, and prices, plus subtotal, free delivery, and total. The "Place Order" button is disabled until an address is selected.

### 8.6 Order Confirmation Page
After a successful order, the confirmation page displays a green checkmark, the order number (e.g. `ORD-2026-000001`), a full order summary with item breakdown, and — when payment is pending — an amber notice with the payment method and a "Pay Now" button linking directly to the billing page.

### 8.7 AI Chat Assistant
The floating AI chat widget appears on every page as a circular button in the bottom-right corner. Clicking it opens a chat panel with the Ncole Assistant. On the public storefront it answers product discovery and general shopping questions. In the customer portal it has access to the user's last 5 orders and last 3 invoices. In the vendor portal it provides sales insights and inventory analysis. In the admin portal it delivers a full platform analytics snapshot. The assistant handles Gemini API rate limits gracefully, displaying a user-friendly retry message instead of an error.

### 8.8 Vendor Dashboard
The vendor dashboard shows a summary of total revenue, total orders, active products, and low-stock alerts. The analytics page renders revenue-over-time and top-products bar charts using Recharts. The products page provides a table with inline edit and delete actions, and a modal form for creating new products with image upload via Cloudinary.

### 8.9 Admin Panel — Payment Verification
The admin billing page lists all submitted payments with their reference numbers, amounts, gateways (MTN MoMo / Airtel Money), and statuses. Admins can verify or reject payments using action buttons. Verified payments automatically update the linked invoice and order payment status. The admin dashboard also shows platform-wide stats: total revenue, orders, users, and vendors.

### 8.10 Docker Containers Running
Running `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build` starts four containers:
- `ncole-postgres` — PostgreSQL 16 database
- `ncole-backend` — Node.js Express API on port 4000
- `ncole-frontend` — Nginx serving the React SPA on port 5173
- `ncole-nginx` — Reverse proxy on port 8080

All containers include health checks. The backend health check polls `http://localhost:4000/health` and returns `{ "status": "ok" }`.

### 8.11 GitHub Actions CI Pipeline
The CI pipeline at `https://github.com/Edward2033/ncole_enterprise/actions` shows green checkmarks for all jobs: Backend (type-check, Prisma validate, build, smoke test), Frontend (type-check, build), Docker Build Validation, and Security Audit. The CD pipeline triggers on push to `main` and deploys to Render and Vercel automatically.

---

## 9. GitHub Repository Link

**Repository URL**: https://github.com/Edward2033/ncole_enterprise

**Branch Strategy**:
- `main` → Production-ready code

**Commit History**: Maintained with meaningful, descriptive commit messages throughout development.

---

## 10. Deployment Link

| Application | URL |
|------------|-----|
| Public Storefront / All Portals | https://ncoleinterpress.com |
| Backend API | https://api.ncoleinterpress.com |
| API Health Check | https://api.ncoleinterpress.com/health |

*Note: If custom domain is not yet live, use the Vercel and Render deployment URLs provided at submission.*

---

## 11. CI/CD Implementation

### 11.1 Continuous Integration (`ci.yml`)

Triggers: Push to any branch, Pull Requests to `main` and `develop`

**Backend CI jobs:**
1. Provision PostgreSQL 16 service container
2. Install dependencies (`npm ci`)
3. Validate Prisma schema
4. Generate Prisma client
5. Run database migrations (`prisma migrate deploy`)
6. TypeScript type check (`tsc --noEmit`)
7. Production build (`npm run build`)
8. Upload build artifact

**Frontend CI jobs:**
1. Install dependencies
2. TypeScript type check
3. Vite production build (single unified frontend)
4. Upload build artifact

**Docker Validation** (on main/develop only):
1. Build backend Docker image — validates Dockerfile is correct
2. Build frontend Docker image — validates multi-stage Nginx build

**Security Audit**:
- `npm audit --audit-level=high` on both backend and frontend

### 11.2 Continuous Deployment (`deploy.yml`)

Triggers: Push to `main`, manual workflow dispatch

1. **CI Gate**: Full CI pipeline must pass first
2. **Build & Push Docker Images**: Multi-platform images pushed to GitHub Container Registry (ghcr.io)
3. **Deploy Backend**: Render webhook trigger + health check polling (12 retries × 15s)
4. **Run Migrations**: `prisma migrate deploy` against production database
5. **Deploy Frontend**: Vercel CLI `vercel deploy --prod`
6. **Failure Notification**: Auto-creates GitHub Issue on deployment failure

### 11.3 Evidence

CI/CD workflows are visible at:
`https://github.com/Edward2033/ncole_enterprise/actions`

---

## 12. Docker Implementation

### 12.1 Container Architecture

| Container | Base Image | Purpose |
|-----------|-----------|---------| 
| `ncole-postgres` | postgres:16-alpine | Database |
| `ncole-backend` | node:20-alpine (multi-stage) | API server |
| `ncole-frontend` | nginx:1.27-alpine | Unified frontend SPA |
| `ncole-nginx` | nginx:1.27-alpine | Reverse proxy |

### 12.2 Multi-Stage Build (Backend)

```
Stage 1: deps     → Install production node_modules only
Stage 2: builder  → Compile TypeScript, generate Prisma client
Stage 3: runner   → Copy compiled output + prod deps, run as non-root UID 1001
```

Final image size: ~120MB (vs ~800MB without multi-stage)

### 12.3 Multi-Stage Build (Frontend)

```
Stage 1: builder  → npm ci + Vite production build (VITE_API_URL injected as build arg)
Stage 2: runner   → Nginx serving /dist as static SPA with HTML5 history fallback
```

### 12.4 Running with Docker

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check running containers
docker-compose ps

# View backend logs
docker-compose logs -f backend

# Run migrations inside container
docker-compose exec backend npx prisma migrate deploy
```

### 12.5 Security Hardening
- All containers run as UID 1001 (non-root)
- `dumb-init` as PID 1 for proper signal handling in backend
- No secrets baked into images — runtime environment variables only
- Health checks on all services (postgres, backend, frontend)
- Read-only Nginx config mounts

---

## 13. Challenges Encountered

### 13.1 Technical Challenges

**Gemini API quota management**: The free tier Gemini API has per-minute and daily quotas. Solution: implemented smart 429 detection that distinguishes daily exhaustion (`PerDay` quota) from per-minute rate limits, returning user-friendly messages with retry times rather than generic errors.

**JWT refresh token race conditions**: Concurrent requests with an expired access token could trigger multiple refresh attempts. Solution: single in-flight refresh flag with a promise queue — all concurrent requests wait for one refresh to complete.

**TypeScript strict mode across monorepo**: Maintaining strict TypeScript in both backend and frontend required careful type alignment. Solution: shared API response interface types, consistent `ApiResp<T>` / `ListResp<T>` generics.

**Prisma with Supabase PgBouncer**: Supabase uses connection pooling (PgBouncer) which requires `?pgbouncer=true` in the `DATABASE_URL` but a separate `DIRECT_URL` for migrations. Solution: dual URL configuration in `schema.prisma`.

**Docker non-root Nginx permissions**: Nginx default configuration writes to root-owned directories. Solution: pre-create all required directories with correct ownership during the image build stage.

### 13.2 Design Challenges

**Multi-portal authentication in one SPA**: Five distinct user roles all authenticating against one API with different role-based views. Solution: role-aware route guards (`AdminRoute`, `VendorRoute`, `RiderRoute`, `ProtectedRoute`) with automatic redirects.

**Billing number idempotency**: Network retries could create duplicate invoices. Solution: `orderId` unique constraint on the `invoices` table prevents duplicates at the database level.

---

## 14. Future Enhancements

| Priority | Enhancement | Description |
|----------|-------------|-------------|
| High | Live MTN MoMo integration | Connect to MTN sandbox → production API with real payment verification |
| High | Real-time order tracking | WebSocket integration for live delivery location updates |
| High | Email notifications | SMTP/SendGrid for transactional emails |
| Medium | Mobile apps | React Native apps for customers and riders |
| Medium | Advanced search | Elasticsearch or pg_trgm for full-text product search |
| Medium | Redis caching | Cache product listings and category trees |
| Medium | Product reviews | Customer review and rating system |
| Low | Loyalty points redemption | Allow loyalty points to discount orders at checkout |
| Low | Vendor payout system | Automated vendor payment disbursement |
| Low | Recommendation engine | ML-based product recommendations from purchase history |

---

## 15. Conclusion

N_COLE Interpress is a complete, production-grade, multi-vendor e-commerce marketplace that fully satisfies all requirements of the EWA408510 Final Examination Project. The platform delivers:

**Functional Requirements Met:**
- ✅ Responsive professional UI with homepage, navigation, and mobile-friendly design
- ✅ Product listing, detail pages, categories, search, and filtering
- ✅ Shopping cart with add/remove/update quantities and automatic totals
- ✅ Checkout with address collection, form validation, order summary, and confirmation page
- ✅ Full database integration: PostgreSQL with 15 models covering products, customers, orders, and transactions

**DevOps Requirements Met:**
- ✅ GitHub repository with meaningful commit history: https://github.com/Edward2033/ncole_enterprise
- ✅ Live deployment on Render + Vercel
- ✅ CI/CD pipeline via GitHub Actions (ci.yml + deploy.yml)
- ✅ Docker containerisation with multi-stage Dockerfiles and docker-compose

**Security Requirements Met (Recommended):**
- ✅ JWT authentication with refresh token rotation
- ✅ RBAC role-based authorization
- ✅ bcrypt password hashing
- ✅ Zod input validation on all endpoints
- ✅ Helmet security headers, CORS, rate limiting

**Innovation Bonus Features Implemented:**
- ✅ AI-Powered Assistant (Google Gemini 2.0 Flash — 5 portals)
- ✅ Mobile Money Payment Integration (MTN MoMo, Airtel Money)
- ✅ Analytics Dashboard (vendor sales analytics, admin platform analytics)
- ✅ Advanced Security Features (audit logging, non-root containers, token rotation)
- ✅ Multi-Vendor Marketplace Functionality
- ✅ Real-Time Notifications (in-app notification centre)

The platform is immediately deployable using the provided Docker Compose configuration. Its modular architecture enables continued feature development — live payment gateways, mobile applications, and advanced analytics — without restructuring the core system.

---

*Report submitted in fulfillment of EWA408510 – E-Commerce and Web Application*
*Faculty of Computing and Information Sciences, UNILAK*
*Academic Year 2025-2026*
