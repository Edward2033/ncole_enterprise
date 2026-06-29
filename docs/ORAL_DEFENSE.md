# N_COLE Interpress — Oral Defense Preparation Guide

---

## Architecture Explanation (60-second summary)

"N_COLE Interpress is a monorepo containing six web applications and one backend API. The backend is a Node.js/Express REST API written in TypeScript, connected to PostgreSQL through Prisma ORM. The five React frontends — storefront, customer, vendor, admin, and rider portals — communicate exclusively with this API. An Nginx reverse proxy sits in front of everything, routing traffic by subdomain. All components are containerised with Docker and deployed automatically via GitHub Actions."

---

## Database Explanation

"The database has 19 tables across six domains: identity, profiles, catalogue, commerce, billing, and platform. All monetary values are stored as integers in Rwandan Francs to avoid floating-point errors. I used Prisma ORM, which means the application never writes raw SQL — all queries are parameterised and type-safe. Key design decisions include soft deletion on orders and products for audit preservation, and an append-only activity_logs table for compliance."

---

## Security Explanation

"Security is layered. At the HTTP level, Helmet sets security headers and CORS is locked to specific origins. Rate limiting is applied globally at 200 requests per 15 minutes and more aggressively on auth endpoints. Every authenticated endpoint uses JWT with 15-minute access tokens. When a token expires, the client uses a refresh token — which is rotated on every use, meaning a stolen refresh token can only be used once. All sensitive actions are logged to an audit table. Docker containers run as non-root users."

---

## Docker Explanation

"Each component has a Dockerfile using multi-stage builds. The backend has three stages: dependencies, builder (TypeScript compilation), and runner (production image). This reduces the final image from ~800MB to ~120MB and ensures build tools never reach production. All containers run as UID 1001, not root. The docker-compose.yml defines all nine services in a shared network, with health checks ensuring services start in the correct order. Separate dev and prod override files allow different configurations per environment."

---

## CI/CD Explanation

"I have two GitHub Actions workflows. The CI workflow runs on every push and pull request — it installs dependencies, runs type checks, validates the Prisma schema, runs migrations against a real PostgreSQL test container, builds all six applications, and validates the Docker images. The CD workflow triggers only on pushes to main — it builds and pushes Docker images to GitHub Container Registry, deploys the backend via Render's webhook API, waits for a health check to pass, then deploys all five frontends to Vercel in parallel. If anything fails, it automatically creates a GitHub Issue."

---

## AI Assistant Explanation

"The AI is Google Gemini 2.0 Flash, integrated through a three-layer architecture: prompts, context, and service. The prompts layer generates a role-specific system instruction — the public portal gets a shopping assistant persona, the admin gets an analytics expert persona, and so on. The context layer queries the database for safe, pre-aggregated summaries — order counts, revenue totals, low-stock lists — and injects this as grounding data into the prompt. Gemini never touches the database directly. Hard security rules in every system prompt prevent SQL execution, data deletion, and cross-user data exposure."

---

## Payment System Explanation

"When a customer places an order, an invoice is automatically generated with the format INV-2026-000001. The customer then submits a payment — selecting a gateway like MTN MoMo — which creates a payment record PAY-2026-000001. An admin then verifies or rejects the payment. On verification, the invoice status changes to PAID, the order payment status updates to PAID, and the customer receives a notification. Every state change creates a PaymentTransaction record providing a complete audit trail. The gateway architecture is designed so that adding live MTN MoMo credentials activates the existing gateway enum without code changes."

---

## Multi-Vendor Explanation

"The platform is genuinely multi-vendor. Each product is owned by a vendor — identified by vendorId. Each order item is also tagged with the vendor's ID, so when a vendor logs in, they see only their products and only their order line items. Admin sees everything. When Gemini analyses a vendor's data, the context service queries only that vendor's records. The platform supports unlimited vendors, each with independent product catalogues, inventory, and analytics."

---

## Common Examiner Questions & Recommended Answers

**Q: Why did you choose PostgreSQL over MongoDB?**
A: "This platform has complex relational data — orders reference customers, items reference products and vendors, invoices reference orders. PostgreSQL's ACID compliance and foreign key constraints are essential for financial integrity. Prisma makes the ergonomics comparable to a document store while keeping relational consistency."

**Q: How does the refresh token rotation work?**
A: "When a client uses a refresh token, the server deletes that token from the database and issues a brand new one. This means each refresh token is single-use. If an attacker steals a refresh token and tries to use it after the legitimate client already refreshed, the token won't exist in the database and the request fails."

**Q: How do you prevent SQL injection?**
A: "Prisma uses parameterised queries for all database operations. There is zero raw SQL in the application code. Even if a user submits malicious input, Prisma treats it as a string parameter, not as SQL syntax."

**Q: What happens if the AI gives incorrect information?**
A: "The AI only receives pre-computed aggregates from the context service — numbers like order counts and revenue totals that we've already calculated from the database. It cannot query the database itself. If those numbers are correct, the AI's statements about them will be grounded in reality. The system prompt also explicitly instructs the AI never to fabricate figures."

**Q: How does your system scale to many users?**
A: "The stateless JWT architecture means horizontal scaling of the backend requires only adding more API containers behind the Nginx load balancer. PostgreSQL can be scaled vertically or moved to a managed cluster like AWS RDS. Redis is provisioned for caching and queue-based background jobs. The Docker Compose architecture can be migrated to Docker Swarm or Kubernetes with minimal configuration changes."

**Q: Why not use a third-party e-commerce platform like Shopify?**
A: "Shopify and similar platforms don't support MTN Mobile Money natively, lack the multi-vendor model required for a marketplace, charge transaction fees that reduce margins for Rwandan SMEs, and cannot be self-hosted. Building from scratch gives full control over the payment integration, data sovereignty, and long-term cost structure."

**Q: What would you do differently?**
A: "I would implement Redis caching for product listings from the beginning — currently every product browse hits the database directly. I would also use a message queue for notifications rather than fire-and-forget promises, ensuring delivery even if the notification service has a transient error. And I would add integration tests using Supertest against the real Express app."

**Q: Is this platform ready for production?**
A: "The architecture, security model, and DevOps infrastructure are production-ready. The Docker Compose stack can be deployed to any VPS with a single command. The remaining work before commercial launch is: integrating live MTN MoMo and Airtel Money credentials, adding HTTPS/SSL via Let's Encrypt, configuring Cloudinary for image storage, and completing end-to-end testing of the payment flow."

---

## Live Demo Script (5 minutes)

1. Show `docker-compose ps` — all containers healthy
2. Hit `GET /health` — show API response
3. Register a customer account
4. Browse products and add to cart
5. Place an order — show invoice auto-generated (INV-2026-XXXXXX)
6. Submit a payment (PAY-2026-XXXXXX) — show SUBMITTED status
7. Login as admin — verify the payment — show COMPLETED status
8. Open AI chat in customer portal — ask "What are my orders?"
9. Show GitHub Actions — green CI run
10. Show Prisma Studio — live database tables
