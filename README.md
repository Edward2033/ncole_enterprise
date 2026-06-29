# N_COLE Interpress — Enterprise Multi-Vendor Marketplace

[![CI](https://github.com/YOUR_ORG/ncole-interpress/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/ncole-interpress/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A production-grade, AI-powered multi-vendor e-commerce marketplace built for Rwanda and the wider African market.

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
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Project Overview

N_COLE Interpress is a full-stack enterprise e-commerce platform featuring:
- Multi-vendor marketplace with vendor onboarding and product management
- Customer shopping experience with cart, checkout, and order tracking
- Delivery rider management and real-time status updates
- Enterprise billing system with invoice generation and payment verification
- Google Gemini 2.x AI assistant across all five portals
- Complete admin dashboard with analytics and reporting

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
- In-app notification centre
- AI assistant for order help, product recommendations

### Vendor Features
- Product management with variants, images, and SKU tracking
- Order management and fulfilment workflow
- Sales analytics and revenue reports
- AI assistant for inventory and performance insights

### Admin Features
- Full platform management: users, vendors, products, orders
- Payment verification and revenue reporting
- Category management
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
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT (access + refresh token rotation) |
| AI | Google Gemini 2.0 Flash |
| Frontend | React 18, TypeScript, Vite |
| State | Redux Toolkit |
| Styling | Tailwind CSS |
| Validation | Zod |
| Containerisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render (backend), Vercel (frontends) |
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
   ├── / ──────────────── Storefront (React/Vite)
   ├── /api/v1 ─────────── Backend API (Express)
   ├── app.* ───────────── Customer Portal
   ├── vendors.* ───────── Vendor Portal
   ├── admin.* ─────────── Admin Portal
   └── rider.* ─────────── Rider Portal

Backend API
   ├── PostgreSQL (Prisma ORM)
   ├── Redis (caching / future queues)
   └── Google Gemini 2.x (AI)
```

---

## 5. Project Structure

```
N_cole/
├── backend/          # Express API — all business logic
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── config/   # DB, env, logger
│       ├── middleware/
│       ├── modules/  # auth, users, products, orders, billing, ai ...
│       └── shared/   # errors, utils, types
├── src/              # Public storefront (React + shadcn/ui)
├── customers/        # Customer portal (React + Redux)
├── vendors/          # Vendor portal (React + Redux)
├── admin/            # Admin portal (React + Redux)
├── rider/            # Rider portal (React + Redux)
├── nginx/            # Nginx reverse proxy config
├── scripts/          # DB init, backup, restore
├── docs/             # Extended documentation
├── .github/
│   └── workflows/    # ci.yml, deploy.yml
├── docker-compose.yml
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

---

## 6. Installation & Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Quick Start (without Docker)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_ORG/ncole-interpress.git
cd ncole-interpress

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env with your database credentials and secrets
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
# API running at http://localhost:4000

# 3. Setup each frontend (new terminal per portal)
cd ../customers && npm install && npm run dev  # http://localhost:5174
cd ../vendors   && npm install && npm run dev  # http://localhost:5175
cd ../admin     && npm install && npm run dev  # http://localhost:5176
cd ../rider     && npm install && npm run dev  # http://localhost:5177
cd ..           && npm install && npm run dev  # http://localhost:5173 (storefront)
```

---

## 7. Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `ACCESS_TOKEN_SECRET` | JWT secret (min 32 chars) | Yes |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret (min 32 chars) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for AI) |
| `CORS_ORIGIN` | Allowed frontend origins | Yes |
| `CLOUDINARY_*` | Cloudinary credentials | Optional |
| `MOMO_*` | MTN MoMo credentials | Optional |
| `AIRTEL_*` | Airtel Money credentials | Optional |

For frontends, set `VITE_API_URL` in each portal's `.env`:
```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 8. Docker Usage

### Development
```bash
# Start all services in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop
docker-compose down
```

### Production
```bash
# Copy and configure env
cp backend/.env.example .env.production
# Edit .env.production

# Start production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker-compose logs -f backend

# Run migrations in container
docker-compose exec backend npx prisma migrate deploy
```

### Service URLs (Docker dev)
| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Storefront | http://localhost:5173 |
| Customers | http://localhost:5174 |
| Vendors | http://localhost:5175 |
| Admin | http://localhost:5176 |
| Rider | http://localhost:5177 |
| Nginx | http://localhost:8080 |

---

## 9. Deployment

### Backend → Render
1. Create a new Web Service on [render.com](https://render.com)
2. Connect GitHub repository, set root to `backend/`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/server.js`
5. Add all environment variables from `.env.example`

### Frontends → Vercel
1. Import each portal as a separate Vercel project
2. Set root directory per portal (`customers/`, `vendors/`, etc.)
3. Add `VITE_API_URL=https://your-backend.onrender.com/api/v1`

### CI/CD Secrets Required
Configure in GitHub → Settings → Secrets:
```
RENDER_API_KEY, RENDER_SERVICE_ID, BACKEND_URL
VERCEL_TOKEN, VERCEL_ORG_ID
VERCEL_PROJECT_STOREFRONT, VERCEL_PROJECT_CUSTOMERS
VERCEL_PROJECT_VENDORS, VERCEL_PROJECT_ADMIN, VERCEL_PROJECT_RIDER
VITE_API_URL, PRODUCTION_DATABASE_URL
```

---

## 10. API Reference

Base URL: `https://api.ncoleinterpress.com/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` |
| Users | `GET /users/me`, `PATCH /users/me` |
| Products | `GET /products`, `POST /products`, `PATCH /products/:id` |
| Categories | `GET /categories`, `POST /categories` |
| Cart | `GET /cart`, `POST /cart/items`, `DELETE /cart/items/:id` |
| Orders | `POST /orders`, `GET /orders/my`, `GET /orders` (admin) |
| Billing | `GET /billing/invoices`, `POST /billing/invoices/:id/pay` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |
| AI | `POST /ai/chat` |

See `docs/API.md` for full request/response examples.

---

## 11. Security Features

- **JWT**: Short-lived access tokens (15m) + refresh token rotation
- **RBAC**: Role-based access control on every protected route (ADMIN, VENDOR, CUSTOMER, RIDER)
- **Rate Limiting**: Global 200 req/15min, auth endpoints 20 req/15min
- **Helmet**: Security headers on all responses
- **CORS**: Strict origin whitelist
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Prevention**: Prisma parameterised queries — no raw SQL
- **Password Hashing**: bcrypt with salt rounds
- **Non-root Containers**: All Docker containers run as UID 1001
- **Audit Logging**: All sensitive actions logged to `activity_logs`

---

## 12. AI Assistant

Powered by Google Gemini 2.0 Flash. Each portal has a role-scoped AI assistant:

| Portal | Capabilities |
|--------|-------------|
| Public | Product search, FAQ, recommendations |
| Customer | Order/invoice explanation, delivery status, recommendations |
| Vendor | Sales insights, inventory suggestions, performance |
| Rider | Delivery guidance, statistics |
| Admin | Revenue analysis, order/customer/vendor analytics |

**Security**: Gemini never accesses the database directly. All context is pre-aggregated and sanitised before being injected into the prompt.

---

## 13. Billing & Payments

Invoice format: `INV-2026-000001`  
Payment reference: `PAY-2026-000001`

**Workflow**: Order Created → Invoice Auto-Generated → Customer Submits Payment → Admin Verifies → Completed

Supported gateways (ready, no live credentials required): MTN MoMo, Airtel Money, Stripe, Manual.

---

## 14. Notifications

- In-app notification centre on all portals
- Triggered automatically on: order created, order status changes, payment status changes, vendor approval, rider assignment
- Preferences: users can toggle notification categories

---

## 15. Troubleshooting

**Backend won't start**: Check `DATABASE_URL` is correct and PostgreSQL is running.

**Prisma migration errors**: Run `npx prisma migrate reset` (dev only — destroys data).

**CORS errors**: Ensure `CORS_ORIGIN` includes all frontend URLs comma-separated.

**AI returns errors**: Verify `GEMINI_API_KEY` is set and valid.

**Docker containers exit immediately**: Run `docker-compose logs <service>` to inspect startup errors.
