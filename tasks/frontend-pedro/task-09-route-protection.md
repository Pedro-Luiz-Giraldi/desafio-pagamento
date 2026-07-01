# T9: Route Protection and App Routes

**Phase:** 2 — Frontend Core
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Add new routes for client pages and ensure role-based access where needed.

## Target Files

- `frontend/src/App.tsx`

## Details

**New routes:**
| Route | Component | Access |
|-------|-----------|--------|
| `/client/dashboard` | `ClientDashboardPage` | CUSTOMER only |
| `/orders/new` | `OrderCreatePage` | CUSTOMER only |
| `/pay/:orderId` | `PayOrderPage` | CUSTOMER only |
| `/merchants` | `MerchantsListPage` | CUSTOMER only |
| `/merchants/:id` | `MerchantDetailPage` | CUSTOMER only |
| `/products` | `ProductsPage` | MERCHANT_OWNER only |

1. All existing merchant routes remain unchanged
2. Add wrapper component or route guard that checks role for protected routes
3. `ProtectedRoute` already checks auth — extend to optionally check role

## Acceptance Criteria

- All new routes exist and are accessible by correct role
- CUSTOMER cannot access `/products`
- MERCHANT_OWNER cannot access `/merchants`, `/orders/new`, `/pay/:orderId`
- Unauthorized access redirects to dashboard
- TypeScript compiles

## Traceability

R10
