package com.acaboumony.notification.integration;

import com.acaboumony.notification.NotificationServiceApplication;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.acaboumony.notification.repository.NotificationLogRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Integration test: Order → Kafka → Email via GreenMail.
 * <p>
 * Requires Docker for Testcontainers (PostgreSQL) or H2 in-memory DB.
 * Disabled by default — run manually with:
 * {@code mvn test -Dtest=OrderCreatedEmailIntegrationIT -Dspring.profiles.active=test}
 */
@SpringBootTest(classes = NotificationServiceApplication.class)
@EmbeddedKafka(topics = {"order.created", "order.cancelled"},
        bootstrapServersProperty = "spring.kafka.bootstrap-servers",
        partitions = 1)
@Disabled("Integration test requires Docker or H2. Run manually.")
public class OrderCreatedEmailIntegrationIT {

    static GreenMail greenMail;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockBean
    private NotificationLogRepository notificationLogRepository;

    @BeforeAll
    static void startGreenMail() {
        greenMail = new GreenMail(ServerSetup.SMTP.dynamicPort());
        greenMail.start();
    }

    @AfterAll
    static void stopGreenMail() {
        if (greenMail != null) {
            greenMail.stop();
        }
    }

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> String.valueOf(greenMail.getSmtp().getPort()));
        registry.add("spring.mail.username", () -> "");
        registry.add("spring.mail.password", () -> "");
        registry.add("spring.mail.properties.mail.smtp.auth", () -> "false");
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false");
        registry.add("spring.mail.properties.mail.smtp.starttls.required", () -> "false");
        registry.add("notification.email.rate-limit", () -> "1000");
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
        registry.add("spring.jpa.properties.hibernate.default_schema", () -> "");
        registry.add("spring.autoconfigure.exclude", () -> "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration");
    }

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

        waitForEmail();

        var messages = greenMail.getReceivedMessages();
        assertNotNull(messages);
        var delivery = messages[0];
        assertNotNull(delivery);
    }

    @Test
    void deve_enviar_email_quando_order_cancelled_event() throws Exception {
        var orderId = UUID.randomUUID();

        kafkaTemplate.send(new ProducerRecord<>("order.cancelled", orderId.toString(),
                new OrderCancelledEvent(
                        orderId,
                        UUID.randomUUID(),
                        "cliente@test.com",
                        "CANCELLED",
                        "CUSTOMER_REQUEST",
                        Instant.now()
                )));

        waitForEmail();

        var messages = greenMail.getReceivedMessages();
        assertNotNull(messages);
        var delivery = messages[0];
        assertNotNull(delivery);
    }

    private void waitForEmail() throws InterruptedException {
        var maxAttempts = 30;
        for (int i = 0; i < maxAttempts; i++) {
            if (greenMail.getReceivedMessages().length > 0) {
                return;
            }
            Thread.sleep(500);
        }
    }

    record OrderCreatedEvent(
            UUID orderId,
            UUID customerId,
            String customerEmail,
            UUID merchantId,
            Long totalInCents,
            List<OrderItemEvent> items,
            Instant createdAt
    ) {
        record OrderItemEvent(
                String productId,
                String description,
                Integer quantity,
                Long unitPriceInCents,
                Long subtotalInCents
        ) {}
    }

    record OrderCancelledEvent(
            UUID orderId,
            UUID customerId,
            String customerEmail,
            String status,
            String reason,
            Instant cancelledAt
    ) {}
}
