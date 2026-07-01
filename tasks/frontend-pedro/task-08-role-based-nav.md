# T8: Role-Based Navigation

**Phase:** 2 — Frontend Core
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Modify `AuthenticatedLayout` to show different navigation items based on user role.

## Target Files

- `frontend/src/layouts/authenticated-layout.tsx`

## Details

1. Read `user.role` from auth store
2. Merchant nav: Dashboard (`/`), Orders (`/orders`), Transactions (`/transactions`), Products (`/products`), Settings (`/settings`)
3. Client nav: Dashboard (`/`), My Orders (`/orders`), My Transactions (`/transactions`), Merchants (`/merchants`), Settings (`/settings`)
4. "New Order" button only appears for Client role

## Acceptance Criteria

- Merchant sees their navigation items
- Client sees their navigation items
- Each nav item links to correct route
- Tests pass

## Traceability

R7, R8, R9
