# T1: CUSTOMER Registration in user-service

**Phase:** 1 — Backend Foundation
**Service:** user-service
**Dependencies:** None

## TDD Mode: REQUIRED

Siga RED → GREEN → REFACTOR. Testes com `deve_<comportamento>_quando_<condição>()`. Use Testcontainers (nunca H2).

## Objective

Modify the registration endpoint to accept CUSTOMER registration without CNPJ/companyName.

## Target Files

- `services/user-service/src/main/java/com/acaboumony/user/dto/request/RegisterRequest.java`
- `services/user-service/src/main/java/com/acaboumony/user/validation/RegisterRequestValidator.java`
- `services/user-service/src/main/java/com/acaboumony/user/service/AuthService.java`
- `services/user-service/src/main/java/com/acaboumony/user/controller/AuthController.java`

## Details

1. `RegisterRequest` — add `role` field (CUSTOMER or MERCHANT_OWNER). If omitted, default to MERCHANT_OWNER (backward compat).
2. `RegisterRequestValidator` — if role=CUSTOMER, `companyName` and `cnpj` are optional (no validation). If role=MERCHANT_OWNER, existing validation unchanged. If role=STAFF, reject.
3. `AuthService.register()` — if CUSTOMER, skip `MerchantService.createMerchant()`, create only User with `role=CUSTOMER`.
4. Verify `AuthController` passes role through correctly.

## Acceptance Criteria

- CUSTOMER registration succeeds with just fullName, email, password
- MERCHANT_OWNER registration still requires companyName + cnpj (unchanged)
- Existing registration tests pass
- User created as CUSTOMER has `merchant_id = null`

## Traceability

R1, R2, R3, R4
