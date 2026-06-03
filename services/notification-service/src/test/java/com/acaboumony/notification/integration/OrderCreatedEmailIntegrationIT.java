package com.acaboumony.notification.integration;

import com.acaboumony.notification.dto.event.OrderCancelledEvent;
import com.acaboumony.notification.dto.event.OrderCreatedEvent;
import com.acaboumony.notification.support.BaseIntegrationTest;
import jakarta.mail.internet.MimeMessage;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Tag("integration")
class OrderCreatedEmailIntegrationIT extends BaseIntegrationTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    void deve_enviar_email_quando_order_created_event() throws Exception {
        var orderId = UUID.randomUUID();
        var customerEmail = "cliente@test.com";

        kafkaTemplate.send(new ProducerRecord<>("order.created", orderId.toString(),
                new OrderCreatedEvent(
                        orderId,
                        UUID.randomUUID(),
                        customerEmail,
                        UUID.randomUUID(),
                        16970L,
                        List.of(new OrderCreatedEvent.OrderItemEvent(
                                "prod_001", "Vestido Azul", 1, 8990L, 8990L
                        )),
                        Instant.now()
                )));

        MimeMessage delivery = waitForEmail();

        assertNotNull(delivery);
        assertThat(delivery.getAllRecipients()[0].toString()).isEqualTo(customerEmail);
        assertThat(delivery.getSubject()).contains("Pedido confirmado");
    }

    @Test
    void deve_enviar_email_quando_order_cancelled_event() throws Exception {
        var orderId = UUID.randomUUID();

        kafkaTemplate.send(new ProducerRecord<>("order.cancelled", orderId.toString(),
                new OrderCancelledEvent(
                        orderId,
                        UUID.randomUUID(),
                        "cliente@test.com",
                        UUID.randomUUID(),
                        10000L,
                        "CUSTOMER_REQUEST",
                        Instant.now()
                )));

        MimeMessage delivery = waitForEmail();

        assertNotNull(delivery);
        assertThat(delivery.getSubject()).contains("Pedido cancelado");
    }

    private MimeMessage waitForEmail() throws InterruptedException {
        var maxAttempts = 30;
        for (int i = 0; i < maxAttempts; i++) {
            var messages = greenMail.getReceivedMessages();
            if (messages.length > 0) {
                return messages[0];
            }
            Thread.sleep(500);
        }
        return null;
    }
}
