# T19: Order Detail with Pay Button

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Modify order detail page to show "Pagar" button for CUSTOMER when order is PENDING.

## Target Files

- `frontend/src/pages/orders/order-detail-page.tsx`

## Details

1. Check `user.role` and `order.status`
2. If CUSTOMER and order is PENDING: show "Pagar" button → `/pay/{orderId}`
3. All existing order info unchanged
4. Merchant cancellation still works (if currently exists)

## Acceptance Criteria

- Client sees "Pagar" button on their PENDING order detail
- Merchant does not see "Pagar" button
- Existing order detail functionality preserved
- Tests pass

## Traceability

R19
