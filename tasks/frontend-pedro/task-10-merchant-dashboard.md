# T10: Merchant Dashboard — Remove "New Order"

**Phase:** 3 — Merchant Frontend
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Remove the "New Order" quick action from the merchant dashboard. Merchants don't create orders.

## Target Files

- `frontend/src/pages/dashboard/dashboard-page.tsx`

## Details

1. Check `user.role` in dashboard page
2. If MERCHANT_OWNER, hide "New Order" button/quick action
3. All other dashboard content unchanged

## Acceptance Criteria

- Merchant dashboard has no "New Order" button
- All other dashboard content (pending orders, transactions, cards) unchanged
- If dashboard needs to exist for CUSTOMER role too, show "New Order" for CUSTOMER

## Traceability

R11
