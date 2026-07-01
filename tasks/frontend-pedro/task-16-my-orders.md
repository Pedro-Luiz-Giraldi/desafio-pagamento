# T16: My Orders List

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Modify the orders list page to show only the client's own orders, with a "Pagar" button for PENDING orders.

## Target Files

- `frontend/src/pages/orders/orders-list-page.tsx`

## Details

1. If role=CUSTOMER, fetch orders filtered by `customerId={userId}`
2. Add "Pagar" button in each PENDING order row → navigates to `/pay/{orderId}`
3. Remove "New Order" button from header (already in dashboard/nav)
4. Keep all existing columns and filtering

## Acceptance Criteria

- Client sees only their orders
- "Pagar" button appears for PENDING orders
- Clicking "Pagar" navigates to `/pay/{orderId}`
- Merchant still sees all orders for their merchant (unchanged)
- Tests pass

## Traceability

R18
