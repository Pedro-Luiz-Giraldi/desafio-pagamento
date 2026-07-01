# T5: Payment Transaction Authorization

**Phase:** 1 — Backend Foundation
**Service:** payment-service
**Dependencies:** None

## TDD Mode: REQUIRED

Siga RED → GREEN → REFACTOR. Testes com `deve_<comportamento>_quando_<condição>()`. Use Testcontainers (nunca H2).

## Objective

Ensure payment endpoint enforces that `customerId` in request body matches authenticated `X-User-Id` for CUSTOMER role (prevent impersonation). Ensure transaction listing works for CUSTOMER (own transactions only).

## Target Files

- `services/payment-service/src/main/java/com/acaboumony/payment/controller/TransactionController.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/service/TransactionService.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/domain/repository/TransactionRepository.java`

## Details

1. In `TransactionController.processTransaction()`:
   - Read `X-User-Id` header
   - If `X-User-Role` is CUSTOMER, verify `request.customerId()` matches `X-User-Id`; reject with 403 if mismatch
   - If MERCHANT_OWNER, existing logic unchanged
2. Transaction listing: if CUSTOMER, filter by `customerId = X-User-Id`
3. Verify `GET /api/v1/transactions?customerId=` respects authorization — CUSTOMER can only query their own ID

## Acceptance Criteria

- CUSTOMER cannot create payment for another user's `customerId`
- MERCHANT_OWNER flow unchanged
- CUSTOMER sees only their transactions in listing
- Existing tests pass

## Traceability

R19, R22
