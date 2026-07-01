# T22: Edge Cases

**Phase:** 5 — Integration & Polish
**Service:** all
**Dependencies:** T17

## TDD Mode: NOT REQUIRED (manual edge case testing)

## Objective

Handle expired orders, failed payment retry, concurrent payment attempts.

## Test Scenarios

1. Attempt to pay an expired order → show "Pedido expirado" message
2. Payment fails due to fraud → client can retry with different card
3. Concurrent payment attempts → idempotency key prevents double charge
4. Cancel a PENDING order → verify no longer shows "Pagar" button

## Acceptance Criteria

- All edge cases handled gracefully
- User-friendly error messages in Portuguese

## Traceability

R24
