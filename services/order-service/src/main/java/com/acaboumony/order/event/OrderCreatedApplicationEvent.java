package com.acaboumony.order.event;

import org.springframework.context.ApplicationEvent;

public class OrderCreatedApplicationEvent extends ApplicationEvent {
    private final OrderCreatedEvent orderCreatedEvent;

    public OrderCreatedApplicationEvent(Object source, OrderCreatedEvent orderCreatedEvent) {
        super(source);
        this.orderCreatedEvent = orderCreatedEvent;
    }

    public OrderCreatedEvent getOrderCreatedEvent() {
        return orderCreatedEvent;
    }
}
