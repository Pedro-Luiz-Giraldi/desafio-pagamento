package com.acaboumony.order.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class OrderEventProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventProducer.class);
    private static final String TOPIC_ORDER_CREATED = "order.created";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCreated(OrderCreatedApplicationEvent applicationEvent) {
        OrderCreatedEvent event = applicationEvent.getOrderCreatedEvent();
        log.info("Publishing order.created event for orderId={} (after transaction commit)", event.orderId());
        try {
            kafkaTemplate.send(TOPIC_ORDER_CREATED, event.orderId().toString(), event);
        } catch (Exception e) {
            log.error("Failed to publish order.created event for orderId={}", event.orderId(), e);
            // Order is already committed to DB, so we just log the error
            // A retry mechanism or dead letter queue could be added here
        }
    }

    private static final String TOPIC_ORDER_CANCELLED = "order.cancelled";

    public void publishOrderCancelled(OrderCancelledEvent event) {
        log.info("Publishing order.cancelled event for orderId={}", event.orderId());
        kafkaTemplate.send(TOPIC_ORDER_CANCELLED, event.orderId().toString(), event);
    }
}
