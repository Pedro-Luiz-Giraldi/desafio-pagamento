CREATE SCHEMA IF NOT EXISTS order_service;

SET search_path TO order_service;

CREATE TABLE orders (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    customer_id     UUID         NOT NULL,
    merchant_id     UUID         NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    total_in_cents  BIGINT       NOT NULL,
    transaction_id  VARCHAR(50),
    idempotency_key UUID         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'))
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_merchant_id ON orders (merchant_id);
CREATE INDEX idx_orders_status      ON orders (status);
