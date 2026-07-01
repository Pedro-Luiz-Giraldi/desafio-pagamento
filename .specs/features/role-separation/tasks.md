# Tasks: Role Separation — Merchant & Client

**Feature:** `role-separation`
**Status:** Ready for execution
**Branch:** `feat/role-separation`

---

## Dependency Graph

```
Phase 1 — Backend Foundation
  T1 (CUSTOMER reg) ───┐
  T2 (Merchant API)  ──┤
  T3 (Products API)  ──┤── [P] ── T4 (Gateway routes)
  T5 (Payment auth)  ──┘
                           │
Phase 2 ───────────────────┤
  T6 (Register toggle) ────┤── T1
  T7 (Login redirect) ─────┤
  T8 (Role-based nav) ─────┤
  T9 (Route protection) ───┤
                           │
Phase 3 ───────────────────┤
  T10 (Merchant dash) ─────┤
  T11 (Products page) ─────┤── T3
  T12 (Keep pages) ────────┤
                           │
Phase 4 ───────────────────┤
  T13 (Client dash) ───────┤
  T14 (Merchants list) ────┤── T2
  T15 (Order create) ──────┤── T2, T3, T14
  T16 (My Orders) ─────────┤
  T17 (Payment) ───────────┤── T5
  T18 (My Transactions) ───┤── T5
  T19 (Order detail pay) ──┤

Phase 5 — Integration
  T20 (Flow verify)
  T21 (Pay later)
  T22 (Edge cases)
  T23 (Seed data)
```

**Legend:** `[P]` = parallel tasks in same phase

---

## Phase 1 — Backend Foundation

### T1: CUSTOMER Registration in user-service

**What:** Modify the registration endpoint to accept CUSTOMER registration without CNPJ/companyName.

**Where:**
- `services/user-service/src/main/java/com/acaboumony/user/dto/request/RegisterRequest.java`
- `services/user-service/src/main/java/com/acaboumony/user/validation/RegisterRequestValidator.java`
- `services/user-service/src/main/java/com/acaboumony/user/service/AuthService.java`
- `services/user-service/src/main/java/com/acaboumony/user/controller/AuthController.java`

**Details:**
1. `RegisterRequest` — add `role` field (CUSTOMER or MERCHANT_OWNER). If omitted, default to MERCHANT_OWNER (backward compat).
2. `RegisterRequestValidator` — if role=CUSTOMER, `companyName` and `cnpj` are optional (no validation). If role=MERCHANT_OWNER, existing validation unchanged. If role=STAFF, reject.
3. `AuthService.register()` — if CUSTOMER, skip `MerchantService.createMerchant()`, create only User with `role=CUSTOMER`.
4. Verify `AuthController` passes role through correctly.

**Done when:**
- CUSTOMER registration succeeds with just fullName, email, password
- MERCHANT_OWNER registration still requires companyName + cnpj (unchanged)
- Existing registration tests pass
- User created as CUSTOMER has `merchant_id = null`

**Tests:** Unit + Integration (existing `AuthServiceRegisterIT`)
**Gate:** `mvn test -pl user-service`

**Traceability:** R1, R2, R3, R4

---

### T2: Merchant Listing API

**What:** Create `GET /api/v1/merchants` and `GET /api/v1/merchants/{id}` endpoints in user-service.

**Where:**
- `services/user-service/src/main/java/com/acaboumony/user/controller/MerchantController.java` (new)
- `services/user-service/src/main/java/com/acaboumony/user/dto/response/MerchantSummaryResponse.java` (new)
- `services/user-service/src/main/java/com/acaboumony/user/service/MerchantService.java` (add methods)

**Details:**
1. `MerchantSummaryResponse` record: `(UUID id, String companyName)`
2. `MerchantService.listActiveMerchants()` — `findAllByStatus(ACTIVE)`, map to DTO
3. `MerchantService.getMerchantDetail(id)` — returns `(id, companyName, createdAt)` or 404
4. `MerchantController`:
   - `GET /api/v1/merchants` — list active merchants (public or authenticated)
   - `GET /api/v1/merchants/{id}` — merchant detail
5. Endpoints are public (no auth required for listing) so clients can see merchants before logging in, OR keep authenticated since they need JWT anyway. **Decision:** Keep authenticated (consistent with other endpoints).

**Done when:**
- `GET /api/v1/merchants` returns list of active merchants
- `GET /api/v1/merchants/{id}` returns merchant detail or 404
- Inactive/suspended merchants are excluded
- Tests pass

**Tests:** Unit + Integration
**Gate:** `mvn test -pl user-service`

**Traceability:** R20

---

### T3: Product Entity + API in order-service

**What:** Create Product entity, migration, repository, and read-only API endpoints (`GET /api/v1/products`).

**Where:**
- `services/order-service/src/main/resources/db/migration/V3__create_products.sql` (new)
- `services/order-service/src/main/java/com/acaboumony/order/domain/entity/Product.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/domain/repository/ProductRepository.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/controller/ProductController.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/dto/response/ProductResponse.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/service/ProductService.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/security/ProductAccessPolicy.java` (new, optional)

**Migration `V3__create_products.sql`:**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_in_cents BIGINT NOT NULL CHECK (price_in_cents > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_merchant_id ON products(merchant_id);
CREATE INDEX idx_products_merchant_active ON products(merchant_id, active);
```

**Entity `Product.java`:**
```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    private UUID id;
    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "price_in_cents", nullable = false)
    private Long priceInCents;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

**Endpoints:**
- `GET /api/v1/products?merchantId={id}` — list active products for a merchant
- `GET /api/v1/products/{id}` — get single product

**Done when:**
- Migration runs cleanly
- Product entity and repository work
- `GET /api/v1/products?merchantId=X` returns active products for that merchant
- `GET /api/v1/products/{id}` returns product or 404
- Tests pass

**Tests:** Unit + Integration
**Gate:** `mvn test -pl order-service`

**Traceability:** R26, R27, R28

---

### T4: API Gateway Routes

**What:** Add routes for `/api/v1/products/**` and `/api/v1/merchants/**` in the gateway.

**Where:**
- `services/api-gateway/src/main/resources/application.yml`

**Details:**
1. Add route for `/api/v1/products/**` → order-service:8083
2. Add route for `/api/v1/merchants/**` → user-service:8081
3. Both routes inherit existing auth filter and rate limiting

**Done when:**
- Gateway routes `/api/v1/products/**` to order-service
- Gateway routes `/api/v1/merchants/**` to user-service
- Both routes require authentication (existing global filter)

**Tests:** Manual (check gateway logs)
**Gate:** Smoke test with running services

**Traceability:** R26, R20

---

### T5: Payment Transaction Authorization

**What:** Ensure payment endpoint enforces that `customerId` in request body matches authenticated `X-User-Id` for CUSTOMER role (prevent impersonation). Ensure transaction listing works for CUSTOMER (own transactions only).

**Where:**
- `services/payment-service/src/main/java/com/acaboumony/payment/controller/TransactionController.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/service/TransactionService.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/domain/repository/TransactionRepository.java`

**Details:**
1. In `TransactionController.processTransaction()`:
   - Read `X-User-Id` header
   - If `X-User-Role` is CUSTOMER, verify `request.customerId()` matches `X-User-Id`; reject with 403 if mismatch
   - If MERCHANT_OWNER, existing logic (may have `merchantId` context)
2. Transaction listing: if CUSTOMER, filter by `customerId = X-User-Id`
3. Verify `GET /api/v1/transactions?customerId=` respects authorization — CUSTOMER can only query their own ID

**Done when:**
- CUSTOMER cannot create payment for another user's `customerId`
- MERCHANT_OWNER flow unchanged
- CUSTOMER sees only their transactions in listing
- Existing tests pass

**Tests:** Unit + Integration
**Gate:** `mvn test -pl payment-service`

**Traceability:** R19, R22

---

## Phase 2 — Frontend Core

### T6: Registration Page with Role Toggle

**What:** Add role toggle (Cliente/Merchant) to the registration page. Show/hide fields based on role.

**Where:**
- `frontend/src/pages/auth/register-page.tsx`
- `frontend/src/types/auth.ts`
- `frontend/src/api/auth.api.ts`
- `frontend/src/pages/auth/register-page.test.tsx`

**Details:**
1. Add role toggle (two buttons or radio): "Sou Cliente" | "Sou Merchant"
2. When "Cliente" selected: show fullName, email, password fields only
3. When "Merchant" selected: show fullName, email, password, companyName, CNPJ (existing)
4. `RegisterRequest` type: add optional `role: 'CUSTOMER' | 'MERCHANT_OWNER'`
5. `authApi.register()`: send `role` field based on toggle selection
6. Client registration sends: `{ fullName, email, password, role: 'CUSTOMER' }`
7. Merchant registration sends: `{ fullName, email, password, role: 'MERCHANT_OWNER', companyName, cnpj }`

**Done when:**
- Toggle switches between Cliente and Merchant forms
- Cliente form has only name, email, password fields
- Merchant form has name, email, password, companyName, CNPJ (unchanged)
- API call sends correct role and fields
- Existing merchant registration still works
- Tests pass

**Tests:** Unit (Vitest + Testing Library)
**Gate:** `npm test -- register-page.test.tsx`

**Traceability:** R1, R2, R3, R4

---

### T7: Login Redirect Based on Role

**What:** After successful login, redirect user based on their role.

**Where:**
- `frontend/src/pages/auth/login-page.tsx`
- `frontend/src/stores/auth.store.ts`

**Details:**
1. After login success, check `user.role` from the auth store
2. MERCHANT_OWNER → redirect to `/dashboard`
3. CUSTOMER → redirect to `/client/dashboard`
4. Auth store already has `user` with `role` after login

**Done when:**
- MERCHANT_OWNER login redirects to `/dashboard` (unchanged)
- CUSTOMER login redirects to `/client/dashboard`

**Tests:** Unit (Vitest)
**Gate:** `npm test -- login-page.test.tsx`

**Traceability:** R5, R6

---

### T8: Role-Based Navigation

**What:** Modify `AuthenticatedLayout` to show different navigation items based on user role.

**Where:**
- `frontend/src/layouts/authenticated-layout.tsx`
- `frontend/src/layouts/authenticated-layout.test.tsx`

**Details:**
1. Read `user.role` from auth store
2. Merchant nav: Dashboard (`/`), Orders (`/orders`), Transactions (`/transactions`), Products (`/products`), Settings (`/settings`)
3. Client nav: Dashboard (`/`), My Orders (`/orders`), My Transactions (`/transactions`), Merchants (`/merchants`), Settings (`/settings`)
4. "New Order" button only appears for Client role (in nav or as FAB)

**Done when:**
- Merchant sees their navigation items
- Client sees their navigation items
- Each nav item links to correct route
- Tests pass

**Tests:** Component (Vitest + Testing Library)
**Gate:** `npm test -- authenticated-layout.test.tsx`

**Traceability:** R7, R8, R9

---

### T9: Route Protection and App Routes

**What:** Add new routes for client pages and ensure role-based access where needed.

**Where:**
- `frontend/src/App.tsx`

**New routes:**
| Route | Component | Access |
|-------|-----------|--------|
| `/client/dashboard` | `ClientDashboardPage` | CUSTOMER only |
| `/orders/new` | `OrderCreatePage` | CUSTOMER only (hide from merchant) |
| `/pay/:orderId` | `PayOrderPage` | CUSTOMER only |
| `/merchants` | `MerchantsListPage` | CUSTOMER only |
| `/merchants/:id` | `MerchantDetailPage` | CUSTOMER only |
| `/products` | `ProductsPage` | MERCHANT_OWNER only |

**Details:**
1. All existing merchant routes remain unchanged
2. Add wrapper component or route guard that checks role for protected routes
3. `ProtectedRoute` already checks auth — extend to optionally check role

**Done when:**
- All new routes exist and are accessible by correct role
- CUSTOMER cannot access `/products`
- MERCHANT_OWNER cannot access `/merchants`, `/orders/new`, `/pay/:orderId`
- Unauthorized access redirects to dashboard
- TypeScript compiles

**Tests:** Route guard tests
**Gate:** `npx tsc -b`

**Traceability:** R10

---

## Phase 3 — Merchant Frontend

### T10: Merchant Dashboard — Remove "New Order"

**What:** Remove the "New Order" quick action from the merchant dashboard. Merchants don't create orders.

**Where:**
- `frontend/src/pages/dashboard/dashboard-page.tsx`

**Details:**
1. Check `user.role` in dashboard page
2. If MERCHANT_OWNER, hide "New Order" button/quick action
3. All other dashboard content unchanged

**Done when:**
- Merchant dashboard has no "New Order" button
- All other dashboard content (pending orders, transactions, cards) unchanged
- If dashboard needs to exist for CUSTOMER role too, show "New Order" for CUSTOMER

**Tests:** Component
**Gate:** `npm test`

**Traceability:** R11

---

### T11: Products List Page (Merchant, Read-Only)

**What:** Create a page for merchants to view their product catalog.

**Where:**
- `frontend/src/pages/merchant/products-page.tsx` (new)
- `frontend/src/api/products.api.ts` (new)
- `frontend/src/hooks/use-products.ts` (new)

**Details:**
1. `products.api.ts` — `listByMerchant(merchantId: string): Promise<Product[]>`
2. `use-products.ts` — `useProducts(merchantId)` query via TanStack Query
3. `products-page.tsx` — table/list showing: name, description, price, active status
4. Read-only — no create/edit/delete (products inserted manually via DB)

**Done when:**
- Merchant can navigate to `/products` and see their products
- Shows name, description, price, status for each product
- Loading/empty/error states handled
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R27

---

### T12: Keep Existing Merchant Pages Unchanged

**What:** Verify that existing merchant pages (orders list, order detail, transactions list, transaction detail, settings, 2FA) work without changes for MERCHANT_OWNER role.

**Where:**
- All existing pages in `frontend/src/pages/orders/`
- All existing pages in `frontend/src/pages/transactions/`
- All existing pages in `frontend/src/pages/settings/`

**Details:**
1. Existing pages already filter by X-User-Id / X-Merchant-Id from gateway headers
2. MERCHANT_OWNER sees all orders for their merchant (existing behavior)
3. No code changes needed — just verify no regressions

**Done when:**
- Merchant can view orders (all for their merchant) unchanged
- Merchant can view order detail unchanged
- Merchant can view transactions list unchanged
- Merchant can view transaction detail unchanged
- Merchant can access settings/2FA unchanged

**Tests:** Smoke test/E2E
**Gate:** Manual verification

**Traceability:** R12, R13, R14, R15, R16

---

## Phase 4 — Client Frontend

### T13: Client Dashboard

**What:** Create a dashboard page for CUSTOMER role showing their orders summary and recent transactions.

**Where:**
- `frontend/src/pages/client/client-dashboard-page.tsx` (new)
- `frontend/src/hooks/use-client-dashboard.ts` (new, or reuse hooks)

**Details:**
1. Welcome message: "Olá, {user.fullName}"
2. Summary cards:
   - Total de Pedidos (count)
   - Pedidos Pendentes (count with Pay CTA)
   - Transações Recentes (count)
3. Quick actions:
   - "Novo Pedido" → `/orders/new`
   - "Ver Pedidos" → `/orders`
4. Lists:
   - Últimos pedidos pendentes (3-5 items, clickable)
   - Últimas transações (3-5 items, clickable)

**Data Sources:**
- `GET /api/v1/orders?customerId={userId}&page=0&size=5`
- `GET /api/v1/transactions?customerId={userId}&page=0&size=5`

**Done when:**
- Client dashboard shows user's orders and transactions summary
- "Novo Pedido" navigates to order creation
- Clicking on order navigates to order detail
- Clicking on transaction navigates to transaction detail
- Loading/empty/error states handled
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R17

---

### T14: Merchants List Page

**What:** Create a page for clients to browse available merchants.

**Where:**
- `frontend/src/pages/client/merchants-list-page.tsx` (new)
- `frontend/src/pages/client/merchant-detail-page.tsx` (new)
- `frontend/src/api/merchants.api.ts` (new)
- `frontend/src/hooks/use-merchants.ts` (new)

**Details:**
1. `merchants.api.ts`:
   - `list(): Promise<MerchantSummary[]>` → `GET /api/v1/merchants`
   - `getById(id): Promise<MerchantDetail>` → `GET /api/v1/merchants/{id}`
2. `use-merchants.ts`:
   - `useMerchants()` — TanStack Query for list
   - `useMerchant(id)` — TanStack Query for detail
3. `merchants-list-page.tsx`:
   - List of merchants: companyName, click to detail
   - Each card has "Criar Pedido" button → navigates to `/orders/new?merchantId={id}`
   - Loading/empty/error states
4. `merchant-detail-page.tsx`:
   - Shows merchant name, info
   - "Criar Pedido" button

**Done when:**
- Client sees list of active merchants
- Clicking merchant shows their info
- "Criar Pedido" navigates to order creation with merchant preselected
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R20

---

### T15: Order Creation with Merchant Selection + Product Catalog

**What:** Replace the existing order creation page with a multi-step flow: select merchant → browse products → add items → submit. Keep the existing merchant order creation hidden.

**Where:**
- `frontend/src/pages/orders/order-create-page.tsx` (rewrite)

**Steps:**
1. **Step 1 — Select Merchant** (if not preselected from `/merchants`):
   - Dropdown or list of merchants (reuse `useMerchants`)
   - If `?merchantId=` in URL, skip this step
2. **Step 2 — Browse Products:**
   - Fetch products via `useProducts(merchantId)`
   - Display product catalog: name, description, price
   - "Adicionar" button per product
   - Cart summary sidebar/bottom
3. **Step 3 — Review & Submit:**
   - Show cart items (product name, quantity, unit price, subtotal)
   - Allow quantity changes
   - Submit button → `ordersApi.create()`
4. **On success:** Redirect to `/pay/{orderId}` (R23)

**Existing merchant order creation:**
- Hide `/orders/new` from MERCHANT_OWNER nav
- If MERCHANT_OWNER visits `/orders/new` directly, redirect to `/dashboard`

**API call:**
```typescript
await ordersApi.create({
  merchantId: selectedMerchantId,
  items: cartItems.map(item => ({
    productId: item.product.id,
    description: item.product.name,
    quantity: item.quantity,
    unitPriceInCents: item.product.priceInCents,
  }))
})
```

**Done when:**
- Client can select merchant, browse products, add to cart, and submit
- `productId` from catalog is sent (not free-text)
- After submission, redirected to `/pay/{orderId}`
- Merchant visiting `/orders/new` is redirected
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R21, R23

---

### T16: My Orders List

**What:** Modify the orders list page to show only the client's own orders, with a "Pagar" button for PENDING orders.

**Where:**
- `frontend/src/pages/orders/orders-list-page.tsx`

**Details:**
1. If role=CUSTOMER, fetch orders filtered by `customerId={userId}`
2. Add "Pagar" button in each PENDING order row
   - Navigates to `/pay/{orderId}`
3. Remove "New Order" button from header (already in dashboard/nav)
4. Keep all existing columns: Order ID, Items, Total, Status, Date
5. Keep existing filtering by status

**Done when:**
- Client sees only their orders
- "Pagar" button appears for PENDING orders
- Clicking "Pagar" navigates to `/pay/{orderId}`
- Merchant still sees all orders for their merchant (unchanged)
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R18

---

### T17: Payment Page

**What:** Create the payment page with card form, MercadoPago tokenization, and payment processing.

**Where:**
- `frontend/src/pages/client/pay-order-page.tsx` (new)
- `frontend/src/api/transactions.api.ts` (add `create()`)
- `frontend/src/hooks/use-transactions.ts` (add mutation)

**Details:**

1. **Load order info:** Fetch order details (`useOrder(orderId)`)
   - Verify order belongs to current user
   - Verify order is PENDING (or PROCESSING for retry)
   - Show order summary (items, total)

2. **Card form:**
   - Load MercadoPago JS SDK: `<script src="https://sdk.mercadopago.com/js/v2"></script>`
   - Initialize: `new MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY)`
   - Card fields: card number, expiry, CVV, cardholder name, installments (1-12)
   - Use MercadoPago `cardForm` or manual tokenization via `createCardToken()`
   - On submit: get `cardToken` from MP SDK

3. **Process payment:**
   ```typescript
   await transactionsApi.create({
     amountInCents: order.totalInCents,
     currency: 'BRL',
     customerId: user.id,
     orderId: order.orderId,
     cardToken: cardToken,        // from MercadoPago SDK
     paymentMethodId: 'master',  // from card brand detection
     installments: selectedInstallments,
     idempotencyKey: uuidv4(),
   })
   ```

4. **Result:**
   - Success: show success message, redirect to `/orders/{orderId}` (R25)
   - Failed (declined/fraud): show error, option to retry or go to orders (R24)
   - Processing: show "em processamento", redirect to order detail

**Done when:**
- Order info loads and displays correctly
- Card form renders with MP SDK tokenization
- Successful payment redirects to order detail (PAID)
- Failed payment shows error and option to retry
- Backend `POST /api/v1/transactions` receives the request correctly
- Tests pass

**Tests:** Component + Integration (mock MP SDK)
**Gate:** `npm test`

**Traceability:** R22, R23, R24, R25

---

### T18: My Transactions List

**What:** Modify transactions list page to show only the client's own transactions.

**Where:**
- `frontend/src/pages/transactions/transactions-list-page.tsx`

**Details:**
1. If role=CUSTOMER, fetch transactions filtered by `customerId={userId}`
2. Keep existing columns and filtering
3. No refund action for CUSTOMER (already handled by backend)

**Done when:**
- Client sees only their transactions
- Merchant still sees all transactions for their merchant (unchanged)
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R19

---

### T19: Order Detail with Pay Button

**What:** Modify order detail page to show "Pagar" button for CUSTOMER when order is PENDING.

**Where:**
- `frontend/src/pages/orders/order-detail-page.tsx`

**Details:**
1. Check `user.role` and `order.status`
2. If CUSTOMER and order is PENDING: show "Pagar" button
3. Button navigates to `/pay/{orderId}`
4. All existing order info unchanged
5. Merchant cancellation still works (if currently exists)

**Done when:**
- Client sees "Pagar" button on their PENDING order detail
- Merchant does not see "Pagar" button
- Existing order detail functionality preserved
- Tests pass

**Tests:** Component + Unit
**Gate:** `npm test`

**Traceability:** R19

---

## Phase 5 — Integration & Polish

### T20: Verify Redirect Flow (Create → Pay → Success/Failure)

**What:** End-to-end verification of the client order lifecycle.

**Test scenarios:**
1. Client selects merchant → adds products → creates order → redirected to `/pay/{orderId}`
2. Payment succeeds → redirect to order detail showing PAID
3. Payment fails → error shown → click "Voltar para Pedidos" → order list shows PENDING with "Pagar" button
4. Payment succeeds → order status updates via Kafka → merchant can see the order as PAID

**Done when:**
- All 4 scenarios work end-to-end
- No console errors
- Backend services process correctly

**Traceability:** R23, R24, R25

---

### T21: Verify "Pay Later" from Orders List

**What:** Verify client can pay for a PENDING order from the orders list page.

**Test scenarios:**
1. Client creates order, then navigates to `/orders` instead of paying
2. Order shows as PENDING with "Pagar" button
3. Click "Pagar" → payment page loads with correct order
4. Complete payment → redirect to order detail showing PAID

**Done when:**
- Pay from orders list works correctly

**Traceability:** R18, R24

---

### T22: Edge Cases

**What:** Handle expired orders, failed payment retry, concurrent payment attempts.

**Test scenarios:**
1. Attempt to pay an expired order → show "Pedido expirado" message
2. Payment fails due to fraud → client can retry with different card
3. Concurrent payment attempts → idempotency key prevents double charge
4. Cancel a PENDING order → verify no longer shows "Pagar" button

**Done when:**
- All edge cases handled gracefully
- User-friendly error messages in Portuguese

**Traceability:** R24

---

### T23: Clear Dev Database / Seed Data

**What:** Clear existing development data and insert fresh seed data for both roles.

**Where:**
- `scripts/` (existing location for SQL scripts)

**Seed data needed:**
1. At least 2 MERCHANT_OWNER users with merchants
2. Products for each merchant (3-5 each)
3. At least 1 CUSTOMER user
4. At least 1 order with PENDING status (for testing payment)
5. At least 1 order with PAID status (for testing history)

**Done when:**
- Fresh database has test data for all roles
- Both merchant and client users can log in and see data
- Products are visible in merchant/merchant listing

**Traceability:** All requirements

---

## Execution Plan

### Phase 1: Backend Foundation
Run in parallel:
- T1 (CUSTOMER reg) — user-service
- T2 (Merchant API) — user-service
- T3 (Products API) — order-service
- T4 (Gateway routes) — api-gateway
- T5 (Payment auth) — payment-service

**Gate:** `mvn test` passes for all services

### Phase 2: Frontend Core
Run in parallel after T1:
- T6 (Register toggle)
- T7 (Login redirect)
- T8 (Role-based nav)
- T9 (Route protection)

**Gate:** `npx tsc -b && npm test`

### Phase 3: Merchant Frontend
Run in parallel:
- T10 (Merchant dash)
- T11 (Products page) — needs T3
- T12 (Keep pages) — no changes needed

**Gate:** `npm test`

### Phase 4: Client Frontend
Run in parallel after T2, T3, T5:
- T13 (Client dash)
- T14 (Merchants list) — needs T2
- T15 (Order create) — needs T2, T3, T14
- T16 (My Orders)
- T17 (Payment) — needs T5
- T18 (My Transactions)
- T19 (Order detail pay)

**Gate:** `npm test`

### Phase 5: Integration
Sequential:
- T20 → T21 → T22 → T23

**Gate:** Manual E2E verification

---

## Total Estimated Effort

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| P1: Backend Foundation | 5 | 4-6h |
| P2: Frontend Core | 4 | 3-4h |
| P3: Merchant Frontend | 3 | 2-3h |
| P4: Client Frontend | 7 | 8-12h |
| P5: Integration | 4 | 2-4h |
| **Total** | **23** | **19-29h** |

---

## Success Criteria

- [ ] All 23 tasks completed
- [ ] MERCHANT_OWNER: all existing pages work unchanged (no regressions)
- [ ] CUSTOMER: can register, login, browse merchants, create orders, pay, view history
- [ ] Backend services pass all tests: `mvn test`
- [ ] Frontend compiles and tests pass: `npx tsc -b && npm test`
- [ ] All services build without errors: `mvn package` / `npm run build`
- [ ] Fresh database with seed data works for both roles
