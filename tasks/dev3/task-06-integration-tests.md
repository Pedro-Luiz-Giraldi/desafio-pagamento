# Task 06: Integration tests with Testcontainers + GreenMail

## Objective
Create end-to-end integration tests covering the critical flows: Order → Kafka → Email.

## Priority: HIGH

## Target Files
- services/notification-service/src/test/java/com/acaboumony/notification/OrderCreatedEmailIntegrationTest.java (new)

## Dependencies
Tasks 01-05 should be complete (or at least not modified after this test is written)

## TDD Mode: REQUIRED

## Behavior
1. Create `@SpringBootTest` with `@Testcontainers`:
   - Kafka container (confluentinc/cp-kafka:7.6.0)
   - PostgreSQL container (postgres:16-alpine) — for notification-log repository
   - GreenMail container (greenmail/standalone:2.1.2) for SMTP testing
2. Test flow 1: Order created → email received
   - Publish `order.created` event to Kafka
   - Verify notification-service consumes it and sends email via GreenMail
   - Assert email has correct subject, recipient, content
3. Test flow 2: Order cancelled → email received
   - Publish `order.cancelled` event to Kafka
   - Verify notification-service consumes and sends email
   - Assert email content

## Tests
- `deve_enviar_email_quando_order_created_event()`
- `deve_enviar_email_quando_order_cancelled_event()`
