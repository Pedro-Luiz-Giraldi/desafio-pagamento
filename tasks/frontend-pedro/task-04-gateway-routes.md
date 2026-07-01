# T4: API Gateway Routes

**Phase:** 1 — Backend Foundation
**Service:** api-gateway
**Dependencies:** None (but should be verified after T2 and T3)

## TDD Mode: REQUIRED

## Objective

Add routes for `/api/v1/products/**` and `/api/v1/merchants/**` in the gateway.

## Target Files

- `services/api-gateway/src/main/resources/application.yml`

## Details

1. Add route for `/api/v1/products/**` → order-service:8083
2. Add route for `/api/v1/merchants/**` → user-service:8081
3. Both routes inherit existing auth filter and rate limiting

## Acceptance Criteria

- Gateway routes `/api/v1/products/**` to order-service
- Gateway routes `/api/v1/merchants/**` to user-service
- Both routes require authentication (existing global filter)

## Traceability

R26, R20
