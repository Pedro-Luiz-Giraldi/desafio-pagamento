# T3: Product Entity + API in order-service

**Phase:** 1 — Backend Foundation
**Service:** order-service
**Dependencies:** None

## TDD Mode: REQUIRED

Siga RED → GREEN → REFACTOR. Testes com `deve_<comportamento>_quando_<condição>()`. Use Testcontainers (nunca H2).

## Objective

Create Product entity, migration, repository, and read-only API endpoints (`GET /api/v1/products`).

## Target Files

- `services/order-service/src/main/resources/db/migration/V3__create_products.sql` (new)
- `services/order-service/src/main/java/com/acaboumony/order/domain/entity/Product.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/domain/repository/ProductRepository.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/controller/ProductController.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/dto/response/ProductResponse.java` (new)
- `services/order-service/src/main/java/com/acaboumony/order/service/ProductService.java` (new)

## Details

**Migration:**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_in_cents BIGINT NOT NULL CHECK (price_in_cents > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_merchant_id ON products(merchant_id);
CREATE INDEX idx_products_merchant_active ON products(merchant_id, active);
```

**Endpoints:**
- `GET /api/v1/products?merchantId={id}` — list active products for a merchant
- `GET /api/v1/products/{id}` — get single product

## Acceptance Criteria

- Migration runs cleanly
- Product entity and repository work
- `GET /api/v1/products?merchantId=X` returns active products for that merchant
- `GET /api/v1/products/{id}` returns product or 404
- Tests pass

## Traceability

R26, R27, R28
