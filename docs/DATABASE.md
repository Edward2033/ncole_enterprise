# N_COLE Interpress — Database Documentation

Engine: PostgreSQL 16  
ORM: Prisma 5  
All monetary values: Integers in RWF (Rwandan Francs)

---

## Table Overview

| Table | Description |
|-------|-------------|
| `users` | All platform users (ADMIN, VENDOR, CUSTOMER, RIDER) |
| `refresh_tokens` | JWT refresh token storage with expiry |
| `vendors` | Vendor business profiles linked to users |
| `customers` | Customer profiles with loyalty points |
| `riders` | Delivery rider profiles and status |
| `addresses` | Saved delivery addresses per user |
| `categories` | Hierarchical product categories |
| `products` | Products listed by vendors |
| `product_variants` | Product options (size, colour, etc.) |
| `carts` | One cart per customer |
| `cart_items` | Items in a customer's cart |
| `orders` | Placed orders |
| `order_items` | Line items per order |
| `invoices` | Auto-generated invoices per order |
| `payments` | Customer payment submissions |
| `payment_transactions` | Audit trail of payment state changes |
| `notifications` | In-app and email notifications |
| `notification_preferences` | Per-user notification settings |
| `activity_logs` | Audit trail of all sensitive actions |

---

## Key Relationships

```
User (1) ──── (1) Vendor
User (1) ──── (1) Customer
User (1) ──── (1) Rider
User (1) ──── (N) Address
User (1) ──── (N) Notification
User (1) ──── (1) NotificationPreference

Customer (1) ──── (N) Order
Customer (1) ──── (1) Cart
Customer (1) ──── (N) Invoice
Customer (1) ──── (N) Payment

Order (1) ──── (N) OrderItem
Order (1) ──── (1) Invoice

Invoice (1) ──── (N) Payment
Payment (1) ──── (N) PaymentTransaction

Vendor (1) ──── (N) Product
Product (1) ──── (N) ProductVariant
Product (1) ──── (N) OrderItem
Category (1) ──── (N) Product
Category (1) ──── (N) Category (self-referential tree)
```

---

## Indexes

| Table | Indexed Columns | Purpose |
|-------|----------------|---------|
| `users` | `email`, `role` | Login lookup, role filter |
| `products` | `slug`, `vendorId`, `categoryId`, `status` | Browse and search |
| `orders` | `customerId`, `status`, `orderNumber` | Order lookup |
| `order_items` | `orderId`, `vendorId` | Vendor order reports |
| `invoices` | `customerId`, `status` | Billing queries |
| `payments` | `invoiceId`, `customerId`, `status` | Payment management |
| `notifications` | `userId`, `isRead`, `createdAt` | Notification feed |
| `activity_logs` | `userId`, `action`, `createdAt`, `entity+entityId` | Audit search |

---

## Enums

| Enum | Values |
|------|--------|
| `Role` | ADMIN, VENDOR, CUSTOMER, RIDER |
| `OrderStatus` | PENDING, CONFIRMED, PROCESSING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED |
| `PaymentStatus` | PENDING, PAID, FAILED, REFUNDED |
| `PaymentMethod` | MTN_MOMO, AIRTEL_MONEY, CASH_ON_DELIVERY |
| `InvoiceStatus` | DRAFT, ISSUED, PAID, OVERDUE, CANCELLED |
| `BillingPaymentStatus` | PENDING, SUBMITTED, VERIFIED, COMPLETED, REJECTED |
| `PaymentGateway` | MTN_MOMO, AIRTEL_MONEY, STRIPE, MANUAL |
| `ProductStatus` | ACTIVE, DRAFT, ARCHIVED |
| `RiderStatus` | AVAILABLE, BUSY, OFFLINE |
| `AuditAction` | LOGIN, LOGOUT, REGISTER, ROLE_CHANGED, PRODUCT_CREATED, ORDER_CREATED, PAYMENT_SUBMITTED, PAYMENT_VERIFIED, AI_INTERACTION, ... |

---

## Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy

# Reset DB (dev only — destroys data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npm run prisma:seed
```
