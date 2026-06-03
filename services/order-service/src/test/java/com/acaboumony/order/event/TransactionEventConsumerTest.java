package com.acaboumony.order.event;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.domain.enums.OrderStatus;
import com.acaboumony.order.service.OrderCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionEventConsumerTest {

    @Mock
    private OrderCacheService orderCacheService;

    private TransactionEventConsumer consumer;

    private UUID orderId;
    private Order pendingOrder;

    @BeforeEach
    void setUp() {
        consumer = new TransactionEventConsumer(orderCacheService);
        orderId = UUID.randomUUID();
        pendingOrder = new Order();
        pendingOrder.setId(orderId);
        pendingOrder.setStatus(OrderStatus.PENDING);
        pendingOrder.setUpdatedAt(Instant.now());
    }

    @Nested
    class TransactionCompleted {

        @Test
        void shouldSetOrderToPaid() {
            var event = new TransactionCompletedEvent("txn_123", orderId, "APPROVED");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(pendingOrder));

            consumer.consumeTransactionCompleted(event);

            verify(orderCacheService).cacheOrder(pendingOrder);
        }

        @Test
        void shouldSkipWhenOrderNotFound() {
            var event = new TransactionCompletedEvent("txn_456", UUID.randomUUID(), "APPROVED");
            when(orderCacheService.findById(any())).thenReturn(Optional.empty());

            consumer.consumeTransactionCompleted(event);

            verify(orderCacheService, never()).cacheOrder(any());
        }

        @Test
        void shouldSkipWhenOrderNotPending() {
            var paidOrder = new Order();
            paidOrder.setId(orderId);
            paidOrder.setStatus(OrderStatus.PAID);

            var event = new TransactionCompletedEvent("txn_789", orderId, "APPROVED");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(paidOrder));

            consumer.consumeTransactionCompleted(event);

            verify(orderCacheService, never()).cacheOrder(any());
        }
    }

    @Nested
    class TransactionFailed {

        @Test
        void shouldReturnOrderToPending() {
            var processingOrder = new Order();
            processingOrder.setId(orderId);
            processingOrder.setStatus(OrderStatus.PROCESSING);

            var event = new TransactionFailedEvent("txn_123", orderId, "FAILED", "INSUFFICIENT_FUNDS");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(processingOrder));

            consumer.consumeTransactionFailed(event);

            verify(orderCacheService).cacheOrder(processingOrder);
        }

        @Test
        void shouldSkipWhenOrderNotFound() {
            var event = new TransactionFailedEvent("txn_456", UUID.randomUUID(), "FAILED", "ERROR");
            when(orderCacheService.findById(any())).thenReturn(Optional.empty());

            consumer.consumeTransactionFailed(event);

            verify(orderCacheService, never()).cacheOrder(any());
        }

        @Test
        void shouldSkipWhenOrderIsPaid() {
            var paidOrder = new Order();
            paidOrder.setId(orderId);
            paidOrder.setStatus(OrderStatus.PAID);

            var event = new TransactionFailedEvent("txn_789", orderId, "FAILED", "ERROR");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(paidOrder));

            consumer.consumeTransactionFailed(event);

            verify(orderCacheService, never()).cacheOrder(any());
        }
    }

    @Nested
    class TransactionRefunded {

        @Test
        void shouldSetOrderToRefundedWhenFullRefund() {
            var paidOrder = new Order();
            paidOrder.setId(orderId);
            paidOrder.setStatus(OrderStatus.PAID);

            var event = new TransactionRefundedEvent("ref_123", "txn_123", orderId, 8990L, true, "CUSTOMER_REQUEST");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(paidOrder));

            consumer.consumeTransactionRefunded(event);

            verify(orderCacheService).cacheOrder(paidOrder);
        }

        @Test
        void shouldSetOrderToPartiallyRefundedWhenPartialRefund() {
            var paidOrder = new Order();
            paidOrder.setId(orderId);
            paidOrder.setStatus(OrderStatus.PAID);

            var event = new TransactionRefundedEvent("ref_456", "txn_456", orderId, 5000L, false, "PARTIAL_REFUND");
            when(orderCacheService.findById(orderId)).thenReturn(Optional.of(paidOrder));

            consumer.consumeTransactionRefunded(event);

            verify(orderCacheService).cacheOrder(paidOrder);
        }

        @Test
        void shouldSkipWhenOrderNotFound() {
            var event = new TransactionRefundedEvent("ref_789", "txn_789", UUID.randomUUID(), 1000L, true, "REFUND");
            when(orderCacheService.findById(any())).thenReturn(Optional.empty());

            consumer.consumeTransactionRefunded(event);

            verify(orderCacheService, never()).cacheOrder(any());
        }
    }
}
