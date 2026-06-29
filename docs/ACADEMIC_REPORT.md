# N_COLE INTERPRESS
## Enterprise Multi-Vendor E-Commerce Marketplace Platform

---

**ACADEMIC PROJECT REPORT**

**Institution**: [University Name]
**Programme**: [Programme Name]
**Course**: [Course Name / Code]
**Submitted By**: [Student Name(s)]
**Student ID**: [Student ID]
**Supervisor**: [Supervisor Name]
**Submission Date**: [Date]
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
8. Security Features
9. AI Assistant Integration
10. Billing & Payment System
11. Notifications System
12. Multi-Vendor Marketplace Features
13. Screenshots
14. GitHub Repository
15. Deployment URLs
16. CI/CD Implementation
17. Docker Implementation
18. Challenges Encountered
19. Future Enhancements
20. Conclusion

---

## 1. Introduction

N_COLE Interpress is a production-grade, full-stack, multi-vendor e-commerce marketplace platform designed and developed to address the growing demand for digital commerce infrastructure in Rwanda and the wider East African market. The platform provides a comprehensive digital marketplace ecosystem connecting product vendors, customers, delivery riders, and platform administrators through a unified set of web applications.

The platform consists of six distinct web applications: a public-facing storefront, a customer portal, a vendor management portal, an administrative dashboard, and a delivery rider portal — all backed by a single enterprise-grade RESTful API. The system integrates Google's Gemini 2.x large language model to provide context-aware AI assistance across every portal, tailored to each user role.

This project represents both an academic capstone deliverable and a commercially viable product designed for real-world operation beyond the evaluation period.

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
4. Integrate Google Gemini 2.x AI as a context-aware enterprise assistant across all user roles.
5. Deploy a production-ready, containerised platform with automated CI/CD.

**Secondary Objectives:**
6. Implement enterprise security: JWT, RBAC, rate limiting, audit logging.
7. Create comprehensive DevOps infrastructure using Docker and GitHub Actions.
8. Produce academic-quality documentation for all system components.
9. Design the architecture for future scalability to 100,000+ concurrent users.

---

## 4. System Features

### 4.1 Public Storefront
- Product catalogue with category navigation
- Product search and filtering
- Product detail pages with variants
- AI shopping assistant (product discovery, FAQ)

### 4.2 Customer Portal
- Secure registration and login
- Shopping cart with variant support
- Order placement and tracking
- Invoice viewing and payment submission
- Address management
- Real-time notification centre
- AI assistant (order help, invoice explanation, recommendations)

### 4.3 Vendor Portal
- Product listing, editing, and inventory management
- Order management and fulfilment workflow
- Sales analytics and revenue reporting
- AI assistant (inventory suggestions, performance insights)

### 4.4 Admin Portal
- User management (customers, vendors, riders)
- Vendor verification
- Platform-wide product and order management
- Payment verification and revenue reports
- Category management
- Broadcast notifications
- Audit activity log
- AI assistant (revenue analysis, platform analytics)

### 4.5 Rider Portal
- Assigned delivery management
- Status update workflow (pickup → in transit → delivered)
- Earnings overview
- AI delivery guidance assistant

### 4.6 Cross-Platform Features
- **Billing System**: Auto-generated INV/PAY reference numbers, full payment lifecycle
- **Notifications**: Event-driven in-app notifications across all portals
- **AI Assistant**: Role-scoped Google Gemini integration on all five portals
- **Audit Logging**: All sensitive actions logged to `activity_logs`

---

## 5. Technologies Used

| Category | Technology | Justification |
|----------|-----------|---------------|
| Runtime | Node.js 20 | Mature, performant, large ecosystem |
| Framework | Express.js | Lightweight, flexible, industry standard |
| Language | TypeScript | Type safety, maintainability, IDE support |
| Database | PostgreSQL 16 | ACID compliant, relational, production-proven |
| ORM | Prisma 5 | Type-safe queries, migration management |
| Authentication | JSON Web Tokens | Stateless, scalable, refresh token rotation |
| AI | Google Gemini 2.0 Flash | Latest LLM, cost-effective, fast responses |
| Frontend | React 18 + Vite | Modern, fast build tooling |
| UI | Tailwind CSS + shadcn/ui | Consistent design, rapid development |
| State | Redux Toolkit | Predictable state, devtools support |
| Validation | Zod | Runtime + compile-time type safety |
| Containerisation | Docker + Docker Compose | Reproducible environments |
| CI/CD | GitHub Actions | Native GitHub integration, free for open source |
| Deployment | Render + Vercel | Free tiers, Rwanda-accessible |
| Reverse Proxy | Nginx | High-performance, production-proven |
| Logging | Winston | Structured logging, multiple transports |
| Image Storage | Cloudinary | Managed CDN, transformation APIs |

---

## 6. System Architecture

### 6.1 High-Level Architecture

The platform follows a **monorepo, multi-application** architecture with clear separation of concerns:

```
                     ┌─────────────────────────────────────────┐
                     │          Nginx Reverse Proxy             │
                     │  (SSL termination, load balancing,       │
                     │   security headers, rate limiting)        │
                     └──────────────┬──────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼──────┐  ┌──────────▼──────┐   ┌──────────▼──────┐
    │   Storefront   │  │  Customer/Vendor │   │  Admin/Rider    │
    │  (React/Vite)  │  │  Portals (React) │   │  Portals (React)│
    └────────────────┘  └─────────────────┘   └─────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │      Express.js REST API      │
                     │  (TypeScript, Prisma, JWT)    │
                     │  Modules: auth, products,     │
                     │  orders, billing, AI, ...      │
                     └──────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼──────┐  ┌──────────▼──────┐   ┌──────────▼──────┐
    │  PostgreSQL 16  │  │   Redis Cache    │   │  Gemini 2.0 AI  │
    │  (Prisma ORM)  │  │  (future queues) │   │  (via context   │
    └────────────────┘  └─────────────────┘   │   service)      │
                                               └─────────────────┘
```

### 6.2 Backend Module Architecture

The backend follows a **feature-module** pattern:
```
src/modules/
├── auth/         → Register, login, token refresh, logout
├── users/        → Profile management
├── vendors/      → Vendor CRUD, verification
├── products/     → Product + variant management
├── categories/   → Category tree management
├── cart/         → Cart management
├── orders/       → Order placement, status lifecycle
├── addresses/    → Address CRUD
├── notifications/→ Event-driven notification system
├── billing/      → Invoice + payment workflow
└── ai/           → Gemini integration, context service, prompts
```

### 6.3 Security Middleware Pipeline

Every request passes through:
`Helmet → CORS → Rate Limiter → Morgan Logger → Authenticate (optional) → Authorize (role check) → Validate (Zod) → Controller → Error Handler`

---

## 7. Database Design

### 7.1 Core Entity Relationships

The database has 19 tables organised into 6 domains:

- **Identity**: `users`, `refresh_tokens`
- **Profiles**: `vendors`, `customers`, `riders`
- **Catalogue**: `categories`, `products`, `product_variants`
- **Commerce**: `carts`, `cart_items`, `orders`, `order_items`, `addresses`
- **Billing**: `invoices`, `payments`, `payment_transactions`
- **Platform**: `notifications`, `notification_preferences`, `activity_logs`

### 7.2 Key Design Decisions

1. **All monetary values stored as integers (RWF)**: Eliminates floating-point precision errors in financial calculations.
2. **Soft deletion on orders and products**: `deletedAt` field preserves audit trail while hiding records from normal queries.
3. **Idempotent invoice generation**: Invoice creation checks for existing records, preventing duplicates from retry requests.
4. **Refresh token rotation**: Each token use issues a new token and invalidates the old one, mitigating theft.
5. **ActivityLog as append-only**: No updates or deletes allowed on audit records.

### 7.3 Invoice and Payment Number Format

```
INV-{YEAR}-{SEQUENCE}  →  INV-2026-000001
PAY-{YEAR}-{SEQUENCE}  →  PAY-2026-000001
```

Sequences are database-count based and zero-padded to 6 digits.

---

## 8. Security Features

### 8.1 Authentication & Authorisation
- **JWT access tokens**: 15-minute expiry, signed with HS256
- **Refresh token rotation**: Single-use tokens stored in database, rotated on each refresh
- **RBAC middleware**: Every protected route specifies required roles
- **Password hashing**: bcrypt with 12 salt rounds

### 8.2 API Security
- **Helmet.js**: Sets 11 security headers including HSTS, CSP, X-Frame-Options
- **CORS**: Strict origin whitelist, credentials mode
- **Rate limiting**: 200 requests/15min globally, 20/15min on auth endpoints
- **Input validation**: Zod schemas on all request bodies, params, and queries
- **SQL injection prevention**: Prisma uses parameterised queries exclusively — zero raw SQL in application code

### 8.3 Infrastructure Security
- **Non-root containers**: All Docker containers run as UID 1001
- **Read-only mounts**: Configuration files mounted read-only
- **Secret management**: All secrets via environment variables, never in code or images
- **Nginx security headers**: Additional headers at the proxy layer

### 8.4 AI Security
- **No direct DB access**: Gemini only receives pre-aggregated summary data
- **Prompt injection defence**: Hard security rules embedded in every system prompt
- **Data scope isolation**: Each portal's context service only queries data relevant to the authenticated user

---

## 9. AI Assistant Integration

### 9.1 Architecture

```
User Message
     │
     ▼
Zod Validation → optionalAuth → requireAuthForPrivatePortal
     │
     ▼
ai.controller.ts → resolve userName from DB
     │
     ▼
ai.context.ts → build role-scoped DB snapshot (aggregates only)
     │
     ▼
ai.prompts.ts → build system instruction (role + security rules)
     │
     ▼
Google Gemini 2.0 Flash API → multi-turn chat
     │
     ▼
{ reply } → audit log → response
```

### 9.2 Context Data Per Role

| Role | Context Data |
|------|-------------|
| PUBLIC | Active product count, category list, platform info |
| CUSTOMER | Last 5 orders, last 3 invoices, loyalty points |
| VENDOR | Revenue totals, low-stock products, top 5 products |
| RIDER | Delivery counts by status |
| ADMIN | Platform-wide order counts, revenue, customer/vendor totals |

### 9.3 Security Rules (enforced in every prompt)
- No raw SQL execution
- No data deletion
- No cross-user data exposure
- No internal secrets revealed
- No unrestricted write actions

---

## 10. Billing & Payment System

### 10.1 Payment Workflow

```
Order Placed
  └─► Invoice Auto-Generated (INV-2026-XXXXXX)
        └─► Customer Submits Payment (PAY-2026-XXXXXX)
              └─► Admin Verifies
                    ├─► VERIFIED → Invoice PAID, Order paymentStatus=PAID
                    └─► REJECTED → Customer notified, retry available
```

### 10.2 Gateway Architecture

The system is designed with a gateway-agnostic architecture. The `PaymentGateway` enum supports: `MTN_MOMO`, `AIRTEL_MONEY`, `STRIPE`, `MANUAL`.

Each gateway submission stores: gateway type, gateway reference, gateway response payload, timestamps for each state transition.

### 10.3 Audit Trail

Every payment state change creates a `PaymentTransaction` record providing a complete, immutable audit trail of the payment lifecycle.

---

## 11. Notifications System

### 11.1 Event Triggers

| Event | Notification Type | Audience |
|-------|------------------|----------|
| Order placed | ORDER_CREATED | Customer |
| Order status change | ORDER_CONFIRMED, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED | Customer |
| Payment submitted | PAYMENT_STATUS | Customer |
| Payment verified/rejected | PAYMENT_STATUS | Customer |
| Vendor approved | VENDOR_APPROVAL | Vendor |
| Rider assigned | RIDER_ASSIGNMENT | Rider |
| Admin broadcast | SYSTEM_BROADCAST | All / selected users |

### 11.2 Delivery Channels

- **In-App (IN_APP)**: Stored in database, displayed in notification centre
- **Email (EMAIL)**: Architecture prepared, SMTP integration ready

All notifications are fire-and-forget (non-blocking) to avoid impacting core transaction performance.

---

## 12. Multi-Vendor Marketplace Features

### 12.1 Vendor Onboarding
- Vendor registration creates a user account with VENDOR role
- Admin verification step before products can be listed
- Business name, description, logo, MoMo number, bank account storage
- Vendor-scoped product and order visibility

### 12.2 Product Management
- Products linked to vendors; each vendor sees only their own
- Variant system supports size, colour, and other dimensions
- Inventory tracking with per-variant stock quantities
- Product status workflow: DRAFT → ACTIVE → ARCHIVED

### 12.3 Order Routing
- Order items tagged with `vendorId`
- Vendors see only their line items
- Admin has platform-wide visibility
- Riders are assigned per-order by admin

---

## 13. Screenshots

*[Insert application screenshots here]*

Suggested screenshots:
1. Public storefront homepage
2. Product detail page
3. Customer checkout flow
4. Customer order tracking page
5. Invoice view with payment button
6. AI chat assistant in action
7. Vendor dashboard with analytics
8. Admin payment verification panel
9. Docker containers running (`docker-compose ps`)
10. GitHub Actions CI pipeline passing

---

## 14. GitHub Repository

**Repository URL**: `https://github.com/[YOUR_USERNAME]/ncole-interpress`

**Branch Strategy**:
- `main` → Production-ready code, protected branch
- `develop` → Integration branch
- `feature/*` → Feature development branches
- `fix/*` → Bug fix branches

**Pull Request Rules**:
- All PRs require CI to pass before merge
- All PRs require at least one review

---

## 15. Deployment URLs

| Application | URL |
|------------|-----|
| Public Storefront | `https://ncoleinterpress.vercel.app` |
| Customer Portal | `https://ncole-customers.vercel.app` |
| Vendor Portal | `https://ncole-vendors.vercel.app` |
| Admin Portal | `https://ncole-admin.vercel.app` |
| Rider Portal | `https://ncole-rider.vercel.app` |
| Backend API | `https://ncole-backend.onrender.com` |
| API Health | `https://ncole-backend.onrender.com/health` |

*[Update these URLs after deployment]*

---

## 16. CI/CD Implementation

### 16.1 Continuous Integration (`ci.yml`)

Triggers: Push to any branch, Pull Requests to `main` and `develop`

**Backend CI**:
1. Provision PostgreSQL service container
2. Install dependencies
3. Validate Prisma schema
4. Generate Prisma client
5. Run database migrations
6. TypeScript type check
7. Build production output
8. Upload build artifact

**Frontend CI** (parallel matrix: 5 portals):
1. Install dependencies
2. TypeScript type check
3. Vite production build
4. Upload build artifact

**Docker Validation** (on main/develop):
1. Build backend Docker image
2. Validate storefront Docker image

**Security Audit**:
- `npm audit --audit-level=high` on backend and storefront

### 16.2 Continuous Deployment (`deploy.yml`)

Triggers: Push to `main`, manual workflow dispatch

1. **CI Gate**: Full CI must pass
2. **Build & Push Images**: Multi-platform Docker images to GitHub Container Registry
3. **Deploy Backend**: Render webhook trigger + health check verification
4. **Run Migrations**: Prisma migrate deploy against production DB
5. **Deploy Frontends**: Vercel CLI deployment (5 parallel apps)
6. **Failure Notification**: Auto-create GitHub Issue on deployment failure

### 16.3 Rollback Strategy

**Immediate rollback**:
```bash
# Backend: Redeploy previous Docker image tag
curl -X POST "https://api.render.com/v1/services/<id>/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d '{"imageUrl": "ghcr.io/org/ncole-backend:sha-<previous>"}'

# Frontends: Vercel instant rollback via dashboard or CLI
vercel rollback --token=$VERCEL_TOKEN
```

**Database rollback**:
```bash
# Restore from latest backup
./scripts/restore.sh /backups/ncole_backup_<timestamp>.sql.gz
```

---

## 17. Docker Implementation

### 17.1 Container Architecture

| Container | Base Image | Purpose |
|-----------|-----------|---------|
| `ncole-postgres` | postgres:16-alpine | Database |
| `ncole-redis` | redis:7-alpine | Cache / future queues |
| `ncole-backend` | node:20-alpine (multi-stage) | API server |
| `ncole-storefront` | nginx:1.27-alpine | Public website |
| `ncole-customers` | nginx:1.27-alpine | Customer portal |
| `ncole-vendors` | nginx:1.27-alpine | Vendor portal |
| `ncole-admin` | nginx:1.27-alpine | Admin portal |
| `ncole-rider` | nginx:1.27-alpine | Rider portal |
| `ncole-nginx` | nginx:1.27-alpine | Reverse proxy |

### 17.2 Multi-Stage Build (Backend)

```
Stage 1: deps     → Install production node_modules only
Stage 2: builder  → Compile TypeScript, generate Prisma client
Stage 3: runner   → Copy compiled output + prod deps, run as non-root
```

Final image size: ~120MB (vs ~800MB without multi-stage)

### 17.3 Security Hardening
- All containers run as UID 1001 (non-root)
- `dumb-init` as PID 1 for proper signal handling
- Read-only config file mounts
- No secrets baked into images — runtime environment variables only
- Health checks on all services

### 17.4 Persistent Data
- `ncole-postgres-data` volume: database files
- `ncole-redis-data` volume: Redis persistence
- `ncole-backend-logs` volume: application logs
- `ncole-nginx-logs` volume: access/error logs

---

## 18. Challenges Encountered

### 18.1 Technical Challenges

**TypeScript strict mode across monorepo**: Maintaining strict TypeScript across 6 applications required careful type alignment. Solution: shared type definitions and consistent API response interfaces.

**Gemini context window management**: Injecting sufficient database context without exceeding token limits. Solution: context service returns only aggregated summaries, not raw records. History limited to 20 messages.

**JWT refresh token race conditions**: Concurrent requests with an expired access token could trigger multiple refresh attempts. Solution: request queue with a single in-flight refresh flag.

**Prisma circular relations**: Adding Invoice/Payment relations to existing Order/Customer models required careful ordering of model definitions. Solution: back-patch relations at end of schema file.

**Docker non-root nginx permissions**: nginx default configuration writes to directories owned by root. Solution: pre-create required directories with correct ownership during image build.

### 18.2 Design Challenges

**Multi-portal authentication**: Five separate SPAs all authenticating against one API with different user roles. Solution: identical axios interceptor pattern across all portals with role-aware redirects.

**Billing number idempotency**: Network retries could create duplicate invoices. Solution: check for existing invoice by `orderId` before creation (unique constraint).

---

## 19. Future Enhancements

| Priority | Enhancement | Description |
|----------|-------------|-------------|
| High | Live MTN MoMo integration | Connect to MTN sandbox then production API |
| High | Real-time order tracking | WebSocket integration for live status updates |
| High | Email notifications | SMTP/SendGrid integration |
| Medium | Mobile apps | React Native apps for customers and riders |
| Medium | Advanced search | Elasticsearch integration for full-text search |
| Medium | Redis caching | Cache product listings, category trees |
| Medium | Multi-currency | USD, EUR alongside RWF |
| Low | Loyalty points redemption | Allow points to discount orders |
| Low | Vendor payout system | Automated vendor payment disbursement |
| Low | Product reviews | Customer review and rating system |
| Low | Recommendation engine | ML-based product recommendations |

---

## 20. Conclusion

N_COLE Interpress demonstrates that a production-grade, enterprise multi-vendor marketplace can be built as an academic project without sacrificing real-world viability. The platform successfully addresses the identified problem of fragmented digital commerce infrastructure for African SMEs.

**Key achievements:**
- Complete multi-vendor marketplace with 17 database models and 14 backend modules
- AI-powered assistance across five distinct user portals using Google Gemini 2.x
- Localised billing system designed for MTN MoMo and Airtel Money
- Production-ready containerisation with Docker and automated CI/CD via GitHub Actions
- Enterprise security: JWT rotation, RBAC, rate limiting, audit logging, non-root containers

The platform is immediately deployable using the provided Docker Compose configuration and GitHub Actions workflows. Its modular architecture enables the continued addition of features — live payment gateways, mobile applications, and advanced analytics — without restructuring the core system.

N_COLE Interpress is not just a completed academic project. It is the foundation of a viable business.

---

*Report prepared in partial fulfillment of the requirements for [Course Name] at [Institution Name]*
