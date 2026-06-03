package com.acaboumony.order.exception;

import java.util.UUID;

public class OrderCannotBeCancelledException extends RuntimeException {
    private final UUID orderId;
    private final String status;

    public OrderCannotBeCancelledException(UUID orderId, String status) {
        super("Order " + orderId + " cannot be cancelled because status is " + status);
        this.orderId = orderId;
        this.status = status;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public String getStatus() {
        return status;
    }
}
