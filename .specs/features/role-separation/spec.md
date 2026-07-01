# Role Separation: Merchant & Client

## 1. Objective

Separate the existing single-user system into two distinct role-based experiences: **Merchant** (existing MERCHANT_OWNER pages preserved) and **Client** (new CUSTOMER experience). No existing merchant functionality is removed or changed.

## 2. Requirements

### 2.1 Registration
- **R1**: Same registration page with a toggle: "Sou Cliente" | "Sou Merchant"
- **R2**: Client registration: fullName, email, password (no CNPJ/company)
- **R3**: Merchant registration: fullName, email, password, companyName, CNPJ (existing, unchanged)
- **R4**: Both create the user with their respective role (CUSTOMER / MERCHANT_OWNER)

### 2.2 Login
- **R5**: Same login screen (unchanged)
- **R6**: After login, redirect based on role:
  - MERCHANT_OWNER → `/dashboard`
  - CUSTOMER → `/client/dashboard`

### 2.3 Navigation & Layout
- **R7**: Same layout shell, different navigation items per role
- **R8**: Merchant nav: Dashboard, Orders, Transactions, Products, Settings
- **R9**: Client nav: Dashboard, My Orders, My Transactions, Merchants
- **R10**: Protected routes check role where needed (e.g., `/orders/new` is client-only)

### 2.4 Merchant Pages (preserved)
- **R11**: Dashboard — unchanged (summary cards, pending orders, recent transactions)
- **R12**: Orders list — unchanged (all orders for their merchant, filterable, no "New Order")
- **R13**: Order detail — unchanged
- **R14**: Transactions list — unchanged
- **R15**: Transaction detail — unchanged
- **R16**: Settings / 2FA — unchanged

### 2.5 Client Pages (new/modified)
- **R17**: Client Dashboard — shows their orders summary, recent transactions, quick "New Order"
- **R18**: My Orders — filtered to their own orders only; "Pay" button on PENDING orders
- **R19**: My Transactions — filtered to their own transactions only
- **R20**: Merchants List — shows active merchants; click to see merchant info and create order
- **R21**: Order Create — select merchant → browse their product catalog → add items → submit
- **R22**: Payment Page — card form (Mercado Pago tokenization), process payment, show result

### 2.6 Order Lifecycle (Client)
- **R23**: After creating an order, auto-redirect to payment page
- **R24**: If payment cancelled/fails, order stays PENDING; client can pay later from My Orders
- **R25**: Successful payment → redirect to order detail showing PAID status

### 2.7 Product Catalog
- **R26**: Each Merchant has a product catalog
- **R27**: Merchant can view their products (list page, read-only)
- **R28**: Client browses the merchant's products during order creation

## 3. Design

### 3.1 User Service Changes

| Change | Details |
|--------|---------|
| Registration endpoint | Accept `role` field. If CUSTOMER → skip merchant creation, validate only name/email/password. If MERCHANT_OWNER → existing flow. |
| `GET /api/v1/merchants` | New public endpoint. Returns active merchants: `{id, companyName, cnpj (masked), createdAt}` |
| `GET /api/v1/merchants/{id}` | New public endpoint. Returns merchant detail. |

### 3.2 Order Service Changes

| Change | Details |
|--------|---------|
| `products` table | New migration: `id UUID PK, merchant_id UUID NOT NULL, name VARCHAR(255), description TEXT, price_in_cents BIGINT, active BOOLEAN DEFAULT true, created_at, updated_at` |
| Product Entity | `Product` with JPA mapping to `products` table |
| `GET /api/v1/products?merchantId=` | List active products for a merchant |
| `GET /api/v1/products/{id}` | Get product detail |
| Order authorization | Already works: CUSTOMER sees own orders, MERCHANT_OWNER sees merchant orders. Verify `canPurchase()` check. |
| Order creation for CUSTOMER | Already works (accepts `X-User-Id` as customerId). Ensure `X-Merchant-Id` is not required for CUSTOMER order creation (the `merchantId` comes from the request body). |

### 3.3 Payment Service Changes

| Change | Details |
|--------|---------|
| `GET /api/v1/transactions` | Ensure filtering works by `X-User-Id` for CUSTOMER role (own transactions only) |
| `POST /api/v1/transactions` | Ensure `customerId` from body matches `X-User-Id` header — prevent impersonation |
| Transaction listing | Add endpoint to filter by customerId vs merchantId based on role |

### 3.4 API Gateway

| Change | Details |
|--------|---------|
| Products route | Add `/api/v1/products/**` → order-service if products live in order-service, or create new product-service route |
| Merchant routes | Add `/api/v1/merchants/**` → user-service |

### 3.5 Frontend Changes

#### Pages

| Page | Route | Role | Change |
|------|-------|------|--------|
| Login | `/login` | Both | Unchanged |
| Register | `/register` | Both | Add role toggle (Cliente/Merchant), conditional fields |
| Dashboard | `/dashboard` | Merchant | Unchanged (remove "New Order" quick action) |
| Orders List | `/orders` | Both | Role-switched: merchant sees all, client sees own |
| Order Detail | `/orders/:id` | Both | Role-switched: merchant sees all info, client sees own + "Pay" button if PENDING |
| Order Create | `/orders/new` | Client | Replaced: merchant-selection → product-catalog → cart → submit |
| Transactions List | `/transactions` | Both | Role-switched: merchant sees all, client sees own |
| Transaction Detail | `/transactions/:id` | Both | Unchanged |
| Payment | `/pay/:orderId` | Client | New page: card form + MP tokenization + submit |
| Merchants List | `/merchants` | Client | New page: list of active merchants |
| Products | `/products` | Merchant | New page: read-only list of their products |
| Settings | `/settings` | Both | Unchanged |
| 2FA Setup | `/settings/2fa` | Both | Unchanged |
| Client Dashboard | `/client/dashboard` | Client | New page: client's orders summary, recent transactions |

#### Components

| Component | Change |
|-----------|--------|
| `AuthenticatedLayout` | Check user role, render different navigation |
| `ProtectedRoute` | Optionally add role check (e.g., `/orders/new` requires CUSTOMER) |
| Navigation items | Conditional rendering based on role |

#### API Layer

| New/Modified File | Change |
|-------------------|--------|
| `api/merchants.api.ts` | New: list, getById |
| `api/products.api.ts` | New: listByMerchant |
| `api/transactions.api.ts` | Add `create()` method |
| `hooks/use-merchants.ts` | New: merchants query |
| `hooks/use-products.ts` | New: products query |
| `hooks/use-transactions.ts` | Add `useProcessPayment` mutation |

#### Auth

| Change | Details |
|--------|---------|
| Register | Add role toggle, different DTO per role |
| Login | Store role, redirect accordingly |
| Auth store | Already stores user with role — use it for route guards |

## 4. Mercado Pago Card Tokenization

The frontend will use MercadoPago JS SDK (`window.MercadoPago`) to tokenize card data client-side:

1. Load SDK script: `https://sdk.mercadopago.com/js/v2`
2. Initialize: `new MercadoPago(publicKey)` — public key from `VITE_MP_PUBLIC_KEY` env var
3. Create card form with `cardForm.createCardToken()` on submit
4. Send `cardToken` + payment details to `POST /api/v1/transactions`
5. Backend uses the token to create payment via MercadoPago SDK

The backend already handles the full payment processing pipeline (fraud check, MP API call, Kafka events).

## 5. File Changes Summary

### Backend

#### user-service
- `AuthController.java` — new `POST /api/v1/auth/register` body handling with role field
- `MerchantController.java` — new `GET /api/v1/merchants` and `GET /api/v1/merchants/{id}`
- `RegisterRequest.java` — add optional `role` field, conditional validation
- `MerchantResponse.java` — new response DTO

#### order-service
- `db/migration/V3__create_products.sql` — new migration
- `domain/entity/Product.java` — new entity
- `domain/repository/ProductRepository.java` — new repository
- `controller/ProductController.java` — new controller (list, get)
- `dto/request/CreateProductRequest.java` — for future use (admin/script)
- `dto/response/ProductResponse.java` — new DTO
- `service/ProductService.java` — new service

#### payment-service
- `TransactionController.java` — verify customerId matches X-User-Id for CUSTOMER role
- Possibly add customer-based transaction listing

#### api-gateway
- `application.yml` — add routes for `/api/v1/products/**` and `/api/v1/merchants/**`

### Frontend

#### New files
- `frontend/src/pages/client/client-dashboard-page.tsx`
- `frontend/src/pages/client/merchants-list-page.tsx`
- `frontend/src/pages/client/merchant-detail-page.tsx`
- `frontend/src/pages/client/pay-order-page.tsx`
- `frontend/src/pages/merchant/products-page.tsx`
- `frontend/src/api/merchants.api.ts`
- `frontend/src/api/products.api.ts`
- `frontend/src/hooks/use-merchants.ts`
- `frontend/src/hooks/use-products.ts`

#### Modified files
- `frontend/src/pages/auth/register-page.tsx` — role toggle
- `frontend/src/pages/auth/login-page.tsx` — role-based redirect
- `frontend/src/pages/dashboard/dashboard-page.tsx` — remove "New Order" for merchant
- `frontend/src/pages/orders/orders-list-page.tsx` — role-based filtering + "Pay" button for client
- `frontend/src/pages/orders/order-detail-page.tsx` — "Pay" button for client
- `frontend/src/pages/orders/order-create-page.tsx` — merchant selection + product catalog flow
- `frontend/src/pages/transactions/transactions-list-page.tsx` — role-based filtering
- `frontend/src/layouts/authenticated-layout.tsx` — role-based nav
- `frontend/src/api/transactions.api.ts` — add `create()` method
- `frontend/src/hooks/use-transactions.ts` — add `useProcessPayment` mutation
- `frontend/src/App.tsx` — add new routes

## 6. Dependencies Graph

```
R1-R4 (Registration)
  └── R5-R6 (Login redirect)

R7-R10 (Navigation)
  ├── R11-R16 (Merchant pages — reuse existing)
  ├── R17 (Client Dashboard)
  ├── R18 (My Orders) ─── R23-R25 (Payment flow)
  ├── R19 (My Transactions)
  ├── R20 (Merchants List) ─── R21 (Order Create) ─── R22 (Payment Page)
  └── R26-R28 (Product Catalog)

Backend prerequisites:
  ├── user-service: Merchant listing API
  ├── order-service: Product entity + API
  ├── payment-service: Customer-based listing
  └── api-gateway: New routes
```

## 7. Task Breakdown

### Phase 1: Backend Foundation (parallel)

| # | Task | Service | Dependencies |
|---|------|---------|-------------|
| T1 | CUSTOMER registration in user-service | user-service | None |
| T2 | Merchant listing API (GET /api/v1/merchants) | user-service | None |
| T3 | Product entity, migration, and API (GET /api/v1/products) | order-service | None |
| T4 | Gateway routes for /api/v1/products/** and /api/v1/merchants/** | api-gateway | None |
| T5 | Payment transaction authorization (customerId from header) | payment-service | None |

### Phase 2: Frontend Core (parallel)

| # | Task | Dependencies |
|---|------|-------------|
| T6 | Registration page with role toggle | T1 |
| T7 | Login redirect based on role | None |
| T8 | Role-based navigation (AuthenticatedLayout) | None |
| T9 | Role-based route protection (App.tsx) | None |

### Phase 3: Merchant Frontend (parallel)

| # | Task | Dependencies |
|---|------|-------------|
| T10 | Merchant dashboard: remove "New Order" | None |
| T11 | Products list page (read-only, merchant) | T3 |
| T12 | Keep orders/transactions pages as-is | None |

### Phase 4: Client Frontend (parallel)

| # | Task | Dependencies |
|---|------|-------------|
| T13 | Client Dashboard | None |
| T14 | Merchants List page + detail | T2 |
| T15 | Order Create with merchant selection + product catalog | T3, T14 |
| T16 | My Orders list (own orders + Pay button) | None |
| T17 | Payment page (card form + MP tokenization) | T5 |
| T18 | My Transactions list (own transactions) | T5 |
| T19 | Order detail with Pay button for PENDING orders | None |

### Phase 5: Integration & Polish

| # | Task | Dependencies |
|---|------|-------------|
| T20 | Verify redirect flow: create → pay → success/failure | T15, T17 |
| T21 | Verify client can pay later from orders list | T16 |
| T22 | Edge cases: expired orders, failed payment retry | T17 |
| T23 | Clear dev database / fresh seed data | None |

## 8. Gray Areas (Resolved)

| Question | Answer |
|----------|--------|
| Clients can self-register? | Yes |
| Client can have orders with multiple merchants? | Yes |
| How does client select merchant? | From a list of active merchants |
| What orders can merchant see? | All orders for their merchant, all statuses |
| Flow after order creation? | Auto-redirect to payment; can pay later if cancelled |
| What can client see? | Own orders, transactions, payment history, merchant info |
| Clear existing data? | Yes, fresh start |
| Views per role? | Same login, different views after login |
| Product catalog? | Per-merchant catalog, merchant inserts manually via DB |
| In-app payment? | Yes, backend already processes MP; frontend needs card form |
| Toggle in registration? | Yes, single page with role toggle |
| Merchant product management? | Read-only list; products inserted manually in DB |
| MP public key? | Via VITE_MP_PUBLIC_KEY in frontend .env |
