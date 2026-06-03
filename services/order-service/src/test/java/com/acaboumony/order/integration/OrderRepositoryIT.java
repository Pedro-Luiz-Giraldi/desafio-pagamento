package com.acaboumony.order.integration;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.domain.entity.OrderItem;
import com.acaboumony.order.domain.enums.OrderStatus;
import com.acaboumony.order.repository.OrderRepository;
import com.acaboumony.order.support.BaseIntegrationTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
class OrderRepositoryIT extends BaseIntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void deve_salvar_e_recuperar_pedido_no_banco() {
        var orderId = UUID.randomUUID();
        var customerId = UUID.randomUUID();
        var merchantId = UUID.randomUUID();

        var order = new Order();
        order.setId(orderId);
        order.setCustomerId(customerId);
        order.setMerchantId(merchantId);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalInCents(10000L);
        order.setIdempotencyKey(UUID.randomUUID());
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order.setExpiresAt(Instant.now().plusSeconds(900));

        var item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setProductId("prod_001");
        item.setDescription("Item Teste");
        item.setQuantity(2);
        item.setUnitPriceInCents(5000L);
        item.setSubtotalInCents(10000L);

        order.setItems(List.of(item));

        orderRepository.save(order);

        var found = orderRepository.findById(orderId);
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(found.get().getItems()).hasSize(1);
        assertThat(found.get().getItems().getFirst().getDescription()).isEqualTo("Item Teste");
    }

    @Test
    void deve_buscar_pedido_por_idempotency_key() {
        var idempotencyKey = UUID.randomUUID();
        var orderId = UUID.randomUUID();

        var order = new Order();
        order.setId(orderId);
        order.setCustomerId(UUID.randomUUID());
        order.setMerchantId(UUID.randomUUID());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalInCents(5000L);
        order.setIdempotencyKey(idempotencyKey);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order.setExpiresAt(Instant.now().plusSeconds(900));

        orderRepository.save(order);

        var found = orderRepository.findByIdempotencyKey(idempotencyKey);
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(orderId);
    }

    @Test
    void deve_buscar_pedidos_por_customer_id() {
        var customerId = UUID.randomUUID();

        for (int i = 0; i < 3; i++) {
            var order = new Order();
            order.setId(UUID.randomUUID());
            order.setCustomerId(customerId);
            order.setMerchantId(UUID.randomUUID());
            order.setStatus(OrderStatus.PENDING);
            order.setTotalInCents(1000L * (i + 1));
            order.setIdempotencyKey(UUID.randomUUID());
            order.setCreatedAt(Instant.now());
            order.setUpdatedAt(Instant.now());
            order.setExpiresAt(Instant.now().plusSeconds(900));
            orderRepository.save(order);
        }

        var orders = orderRepository.findByCustomerId(customerId, PageRequest.of(0, 10));
        assertThat(orders.getContent()).hasSize(3);
    }
}
