SET search_path TO order_service;

CREATE TABLE order_items (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid(),
    order_id           UUID         NOT NULL,
    product_id         VARCHAR(255) NOT NULL,
    description        VARCHAR(255) NOT NULL,
    quantity           INTEGER      NOT NULL,
    unit_price_in_cents BIGINT      NOT NULL,
    subtotal_in_cents  BIGINT       NOT NULL,
    CONSTRAINT pk_order_items PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
