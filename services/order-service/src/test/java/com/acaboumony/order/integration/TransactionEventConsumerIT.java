package com.acaboumony.order.integration;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.domain.enums.OrderStatus;
import com.acaboumony.order.event.TransactionCompletedEvent;
import com.acaboumony.order.event.TransactionFailedEvent;
import com.acaboumony.order.event.TransactionRefundedEvent;
import com.acaboumony.order.repository.OrderRepository;
import com.acaboumony.order.service.OrderCacheService;
import com.acaboumony.order.support.BaseIntegrationTest;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
class TransactionEventConsumerIT extends BaseIntegrationTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderCacheService orderCacheService;

    private Order createPendingOrder() {
        var order = new Order();
        order.setId(UUID.randomUUID());
        order.setCustomerId(UUID.randomUUID());
        order.setMerchantId(UUID.randomUUID());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalInCents(10000L);
        order.setIdempotencyKey(UUID.randomUUID());
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order.setExpiresAt(Instant.now().plusSeconds(900));
        order.setItems(List.of());
        orderRepository.save(order);
        orderCacheService.cacheOrder(order);
        return order;
    }

    @Test
    void deve_atualizar_pedido_para_PAID_quando_transaction_completed() {
        var order = createPendingOrder();
        var transactionId = UUID.randomUUID().toString();

        kafkaTemplate.send(new ProducerRecord<>("transaction.completed", order.getId().toString(),
                new TransactionCompletedEvent(transactionId, order.getId(), "COMPLETED")));

        var updated = pollUntilStatus(order.getId(), OrderStatus.PAID);
        assertThat(updated).isPresent();
    }

    @Test
    void deve_retornar_pedido_para_PENDING_quando_transaction_failed() {
        var order = createPendingOrder();

        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);
        orderCacheService.cacheOrder(order);

        kafkaTemplate.send(new ProducerRecord<>("transaction.failed", order.getId().toString(),
                new TransactionFailedEvent(UUID.randomUUID().toString(), order.getId(), "FAILED", "Saldo insuficiente")));

        var updated = pollUntilStatus(order.getId(), OrderStatus.PENDING);
        assertThat(updated).isPresent();
    }

    private java.util.Optional<Order> pollUntilStatus(UUID orderId, OrderStatus expectedStatus) {
        var deadline = Instant.now().plus(Duration.ofSeconds(15));
        while (Instant.now().isBefore(deadline)) {
            var order = orderRepository.findById(orderId);
            if (order.isPresent() && order.get().getStatus() == expectedStatus) {
                return order;
            }
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return java.util.Optional.empty();
    }
}
