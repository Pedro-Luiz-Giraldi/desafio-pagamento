# T20: Verify Redirect Flow (Create → Pay → Success/Failure)

**Phase:** 5 — Integration & Polish
**Service:** all
**Dependencies:** T15, T17

## TDD Mode: NOT REQUIRED (integration verification)

## Objective

End-to-end verification of the client order lifecycle.

## Test Scenarios

1. Client selects merchant → adds products → creates order → redirected to `/pay/{orderId}`
2. Payment succeeds → redirect to order detail showing PAID
3. Payment fails → error shown → click "Voltar para Pedidos" → order list shows PENDING with "Pagar" button
4. Payment succeeds → order status updates via Kafka → merchant can see the order as PAID

## Acceptance Criteria

- All 4 scenarios work end-to-end
- No console errors
- Backend services process correctly

## Traceability

R23, R24, R25
