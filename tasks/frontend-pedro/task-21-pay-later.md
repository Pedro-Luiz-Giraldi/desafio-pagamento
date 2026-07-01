# T21: Verify "Pay Later" from Orders List

**Phase:** 5 — Integration & Polish
**Service:** all
**Dependencies:** T16

## TDD Mode: NOT REQUIRED (integration verification)

## Objective

Verify client can pay for a PENDING order from the orders list page.

## Test Scenarios

1. Client creates order, then navigates to `/orders` instead of paying
2. Order shows as PENDING with "Pagar" button
3. Click "Pagar" → payment page loads with correct order
4. Complete payment → redirect to order detail showing PAID

## Acceptance Criteria

- Pay from orders list works correctly

## Traceability

R18, R24
