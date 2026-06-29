# N_COLE Interpress — API Reference

Base URL: `https://api.ncoleinterpress.com/api/v1`

All responses follow:
```json
{ "success": true, "data": {}, "meta": {} }
{ "success": false, "error": "message", "details": {} }
```

---

## Authentication

### POST /auth/register
**Auth**: None | **Role**: Public

Request:
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "SecurePass123", "phone": "+250781234567" }
```
Response `201`:
```json
{ "success": true, "data": { "accessToken": "<jwt>", "refreshToken": "<token>" } }
```

### POST /auth/login
**Auth**: None | **Role**: Public

Request:
```json
{ "email": "jane@example.com", "password": "SecurePass123" }
```
Response `200`:
```json
{ "success": true, "data": { "accessToken": "<jwt>", "refreshToken": "<token>" } }
```

### POST /auth/refresh
Request: `{ "refreshToken": "<token>" }`
Response `200`: `{ "accessToken": "<jwt>", "refreshToken": "<new_token>" }`

### POST /auth/logout
**Auth**: Bearer token
Request: `{ "refreshToken": "<token>" }`
Response `200`: `{ "message": "Logged out" }`

---

## Users

### GET /users/me
**Auth**: Bearer | **Role**: Any

Response:
```json
{ "id": "cuid", "email": "jane@example.com", "name": "Jane Doe", "role": "CUSTOMER", "isActive": true }
```

### PATCH /users/me
**Auth**: Bearer | **Role**: Any

Request: `{ "name": "Jane Smith", "phone": "+250781234568" }`

---

## Products

### GET /products
**Auth**: None | **Role**: Public

Query: `?page=1&limit=20&status=ACTIVE&categoryId=<id>&vendorId=<id>&q=searchterm`

Response:
```json
{
  "success": true,
  "data": [{ "id": "...", "name": "Product", "basePrice": 5000, "stockQty": 10, "status": "ACTIVE" }],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### POST /products
**Auth**: Bearer | **Role**: VENDOR, ADMIN

Request:
```json
{ "name": "Product Name", "slug": "product-name", "basePrice": 5000, "categoryId": "cuid", "description": "...", "stockQty": 50 }
```

### PATCH /products/:id
**Auth**: Bearer | **Role**: VENDOR (own), ADMIN

### DELETE /products/:id
**Auth**: Bearer | **Role**: VENDOR (own), ADMIN

---

## Categories

### GET /categories
**Auth**: None | **Role**: Public

### POST /categories
**Auth**: Bearer | **Role**: ADMIN
Request: `{ "name": "Electronics", "slug": "electronics", "description": "..." }`

---

## Cart

### GET /cart
**Auth**: Bearer | **Role**: CUSTOMER

### POST /cart/items
**Auth**: Bearer | **Role**: CUSTOMER
Request: `{ "productId": "cuid", "variantId": "cuid|null", "quantity": 2 }`

### PATCH /cart/items/:id
Request: `{ "quantity": 3 }`

### DELETE /cart/items/:id

### DELETE /cart
Clear entire cart.

---

## Orders

### POST /orders
**Auth**: Bearer | **Role**: CUSTOMER
Request:
```json
{ "addressId": "cuid", "paymentMethod": "MTN_MOMO", "notes": "Leave at door" }
```
Response `201`: Full order object with items.

### GET /orders/my
**Auth**: Bearer | **Role**: CUSTOMER
Query: `?page=1&limit=10`

### GET /orders
**Auth**: Bearer | **Role**: ADMIN
Query: `?page=1&limit=20`

### PATCH /orders/:id/status
**Auth**: Bearer | **Role**: ADMIN, VENDOR, RIDER
Request: `{ "status": "CONFIRMED" }`

---

## Billing

### GET /billing/invoices
**Auth**: Bearer | **Role**: CUSTOMER

### GET /billing/invoices/:id
**Auth**: Bearer | **Role**: CUSTOMER (own), ADMIN

### POST /billing/invoices/:id/pay
**Auth**: Bearer | **Role**: CUSTOMER
Request:
```json
{ "gateway": "MTN_MOMO", "gatewayRef": "optional_reference" }
```
Response `201`: Payment object with `billingNumber: "PAY-2026-000001"`

### GET /billing/payments
**Auth**: Bearer | **Role**: CUSTOMER

### GET /billing/admin/payments
**Auth**: Bearer | **Role**: ADMIN
Query: `?status=SUBMITTED&page=1&limit=20`

### PATCH /billing/admin/payments/:id/verify
**Auth**: Bearer | **Role**: ADMIN
Request: `{ "action": "VERIFY" }` or `{ "action": "REJECT", "rejectionReason": "Insufficient funds" }`

### GET /billing/admin/reports/revenue
**Auth**: Bearer | **Role**: ADMIN
Query: `?from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z`

---

## Notifications

### GET /notifications
**Auth**: Bearer | **Role**: Any

### PATCH /notifications/:id/read
**Auth**: Bearer | **Role**: Any (own)

### PATCH /notifications/read-all
**Auth**: Bearer | **Role**: Any

### DELETE /notifications/:id
**Auth**: Bearer | **Role**: Any (own)

### POST /notifications/broadcast
**Auth**: Bearer | **Role**: ADMIN
Request: `{ "title": "...", "message": "...", "type": "SYSTEM_BROADCAST" }`

---

## AI Chat

### POST /ai/chat
**Auth**: Optional (required for non-PUBLIC portals)

Request:
```json
{
  "message": "What are my recent orders?",
  "portal": "CUSTOMER",
  "history": [
    { "role": "user", "parts": [{ "text": "Hello" }] },
    { "role": "model", "parts": [{ "text": "Hi! How can I help?" }] }
  ]
}
```
Response:
```json
{ "success": true, "data": { "reply": "Your last 5 orders are..." } }
```

Portal values: `PUBLIC` | `CUSTOMER` | `VENDOR` | `RIDER` | `ADMIN`

---

## Addresses

### GET /addresses
**Auth**: Bearer | **Role**: CUSTOMER

### POST /addresses
**Auth**: Bearer | **Role**: CUSTOMER
Request:
```json
{ "fullName": "Jane Doe", "phone": "+250781234567", "street": "KG 123 St", "district": "Gasabo", "city": "Kigali", "province": "Kigali", "isDefault": true }
```

### PATCH /addresses/:id
### DELETE /addresses/:id

---

## Vendors

### GET /vendors
**Auth**: Bearer | **Role**: ADMIN

### PATCH /vendors/:id
**Auth**: Bearer | **Role**: ADMIN (verify), VENDOR (own profile)
