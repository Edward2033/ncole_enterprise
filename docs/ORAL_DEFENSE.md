# N_COLE Interpress — Oral Defense Preparation Guide
## EWA408510 – E-Commerce and Web Application | UNILAK 2025-2026

---

## Architecture Explanation (60-second summary)

"N_COLE Interpress is a monorepo with a backend API and a single unified React frontend. The backend is a Node.js/Express REST API written in TypeScript, connected to PostgreSQL through Prisma ORM and hosted on Render. The frontend is a single React/Vite application that serves all five portals — public storefront, customer, vendor, admin, and rider — using role-based route guards. An Nginx reverse proxy routes traffic. Everything is containerised with Docker and deployed automatically via GitHub Actions CI/CD."

---

## Database Explanation

"The database has 15 tables across six domains: identity (users, tokens), profiles (vendors, customers, riders), catalogue (categories, products, variants), commerce (carts, orders, addresses), billing (invoices, payments, transactions), and platform (notifications, preferences, activity logs). All monetary values are stored as integers in Rwandan Francs to avoid floating-point precision errors. I used Prisma ORM — the application never writes raw SQL. Key design decisions include soft deletion on orders and products for audit preservation, and an append-only activity_logs table."

---

## Security Explanation

"Security is layered. Helmet sets 11 HTTP security headers on every response. CORS is locked to specific frontend origins. Rate limiting is applied globally at 200 requests per 15 minutes, with stricter limits on auth endpoints. Every protected endpoint uses JWT — 15-minute access tokens plus refresh token rotation, where each refresh token is single-use and rotated on every refresh request. Passwords are hashed with bcrypt. All sensitive actions are logged to an audit table. Docker containers run as UID 1001, never root."

---

## Docker Explanation

"There are four containers: postgres, backend, frontend, and nginx — all defined in docker-compose.yml. The backend uses a three-stage Dockerfile: dependencies stage installs only production packages, builder stage compiles TypeScript and generates the Prisma client, runner stage copies the compiled output and runs as a non-root user. The frontend uses a two-stage build: Vite builds the static bundle with the API URL baked in as a build argument, then Nginx serves the static files with HTML5 history fallback for SPA routing. All containers have health checks."

---

## CI/CD Explanation

"I have two GitHub Actions workflows. The CI workflow runs on every push — it provisions a real PostgreSQL container, installs dependencies, validates the Prisma schema, runs migrations, type-checks both backend and frontend with TypeScript, builds both applications, and validates both Dockerfiles. The CD workflow triggers on pushes to main — it builds and pushes Docker images to GitHub Container Registry, deploys the backend via Render's webhook API and polls the health endpoint until it passes, runs Prisma migrations against production, then deploys the frontend to Vercel. On failure it auto-creates a GitHub Issue."

---

## AI Assistant Explanation

"The AI uses Google Gemini 2.0 Flash through a three-layer architecture: prompts, context, and service. The prompts layer generates a role-specific system instruction per portal. The context layer queries pre-aggregated database summaries — order counts, revenue totals, low-stock lists — and injects them as grounding data. Gemini never touches the database directly. Hard security rules in every system prompt prevent SQL execution, data deletion, and cross-user data exposure. I also handle 429 quota errors gracefully — distinguishing between daily exhaustion and per-minute rate limits, returning user-friendly messages instead of errors."

---

## Payment System Explanation

"When a customer places an order, an invoice is automatically generated with the format INV-2026-000001. The customer submits payment — selecting MTN MoMo, Airtel Money, or Cash on Delivery — which creates a payment record PAY-2026-000001. An admin verifies or rejects the payment. On verification, the invoice status changes to PAID and the customer receives an in-app notification. Every state change creates a PaymentTransaction record for a complete audit trail."

---

## Multi-Vendor Explanation

"Each product is owned by a vendor via vendorId. Each order item is also tagged with the vendor's ID. When a vendor logs in, role-based queries ensure they only see their own products and orders — never another vendor's data. The Gemini AI context service for the vendor portal queries only that vendor's records. Admin sees everything platform-wide."

---

## Common Examiner Questions

**Q: Why PostgreSQL over MongoDB?**
A: "This platform has complex relational data — orders reference customers, items reference products and vendors, invoices reference orders. PostgreSQL's ACID compliance and foreign key constraints are essential for financial integrity. Prisma gives ergonomics comparable to a document store while keeping relational consistency."

**Q: How does refresh token rotation work?**
A: "When a client uses a refresh token, the server deletes that token from the database and issues a new one. Each token is single-use. If an attacker steals a token and tries to use it after the legitimate user already refreshed, the old token no longer exists in the database and the request is rejected."

**Q: How do you prevent SQL injection?**
A: "Prisma uses parameterised queries for all database operations. There is zero raw SQL in the codebase. Even malicious input is treated as a string parameter, not as SQL syntax."

**Q: Why one unified frontend instead of five separate apps?**
A: "One frontend SPA with role-based routing is simpler to build, deploy, and maintain. All five portals share the same component library, API client, authentication context, and build pipeline. Role guards at the route level enforce separation — a CUSTOMER cannot navigate to /vendor or /admin routes."

**Q: What happens if Gemini fails or quota is exhausted?**
A: "The service catches all Gemini errors. Daily quota exhaustion returns a user-friendly message: 'The AI assistant has reached its daily usage limit. Please try again tomorrow.' Per-minute rate limits extract the retry delay from the API error and tell the user exactly how many seconds to wait. No 500 errors are ever exposed."

**Q: Is the application secure against common web vulnerabilities?**
A: "Yes. XSS is mitigated by React's JSX escaping and Helmet's Content-Security-Policy. CSRF is not applicable because JWT in Authorization headers (not cookies) is used for auth. SQL injection is prevented by Prisma's parameterised queries. CORS is locked to specific origins. Rate limiting prevents brute-force attacks. All inputs are validated with Zod before reaching business logic."

**Q: What would you do differently if you had more time?**
A: "I would add integration tests using Supertest against the real Express app, implement Redis caching for product listings, and integrate live MTN MoMo credentials to complete the payment flow end-to-end."

**Q: Is this production-ready?**
A: "The architecture, security model, and DevOps infrastructure are production-ready. The remaining steps before commercial launch are: integrating live MTN MoMo credentials, configuring Cloudinary for image storage, and adding HTTPS via a custom domain."

---

## Live Demo Script (5–7 minutes)

1. Show the running application at the live URL
2. Browse the homepage — hero, categories, featured products
3. Search for a product — show filters (price range, category, sort)
4. Open product detail — show image gallery, variant selection, Add to Cart
5. Show cart — update quantity, remove item, see auto-calculated total
6. Checkout — add delivery address, select MTN MoMo, place order
7. Show order confirmation page with order number (INV-2026-XXXXXX)
8. Open AI chat widget — ask "What products do you have?" — show real Gemini response
9. Show GitHub: `https://github.com/Edward2033/ncole_enterprise` — commit history + Actions tab (green CI)
10. Show Docker: `docker-compose ps` — all 4 containers healthy
11. (Optional) Show Admin panel — vendor management, payment verification, analytics
