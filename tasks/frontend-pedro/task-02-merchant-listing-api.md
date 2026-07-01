# T2: Merchant Listing API

**Phase:** 1 — Backend Foundation
**Service:** user-service
**Dependencies:** None

## TDD Mode: REQUIRED

Siga RED → GREEN → REFACTOR. Testes com `deve_<comportamento>_quando_<condição>()`. Use Testcontainers (nunca H2).

## Objective

Create `GET /api/v1/merchants` and `GET /api/v1/merchants/{id}` endpoints in user-service.

## Target Files

- `services/user-service/src/main/java/com/acaboumony/user/controller/MerchantController.java` (new)
- `services/user-service/src/main/java/com/acaboumony/user/dto/response/MerchantSummaryResponse.java` (new)
- `services/user-service/src/main/java/com/acaboumony/user/service/MerchantService.java` (add methods)

## Details

1. `MerchantSummaryResponse` record: `(UUID id, String companyName)`
2. `MerchantService.listActiveMerchants()` — `findAllByStatus(ACTIVE)`, map to DTO
3. `MerchantService.getMerchantDetail(id)` — returns `(id, companyName, createdAt)` or 404
4. `MerchantController`:
   - `GET /api/v1/merchants` — list active merchants (authenticated)
   - `GET /api/v1/merchants/{id}` — merchant detail
5. Endpoints require authentication (consistent with other endpoints).

## Acceptance Criteria

- `GET /api/v1/merchants` returns list of active merchants (id, companyName)
- `GET /api/v1/merchants/{id}` returns merchant detail (id, companyName, createdAt) or 404
- Inactive/suspended merchants are excluded
- Tests pass

## Traceability

R20
