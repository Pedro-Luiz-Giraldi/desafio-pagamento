# Plano Técnico: Notification Service

**Spec:** [spec.md](spec.md)
**Status:** Draft
**Responsável:** Dev 3
**Sprint:** 2

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| Template engine | Thymeleaf | FreeMarker, Mustache | Built-in no Spring Boot, boa integração com Spring Mail |
| SMTP | Spring JavaMailSender | SendGrid SDK, AWS SES SDK | Agnóstico ao provedor — trocar SMTP sem mudar código |
| Retry de email | 3x com backoff exponencial | RabbitMQ retry | Simples, Kafka já tem semantica de retry via DLQ |
| Idempotência | Tabela `notification_log` no banco | Redis | Precisa de histórico auditável de todos os emails |
| DLQ | Kafka DLQ topic | Nenhum | Eventos que falham 3x vão para DLQ para inspeção manual |

---

## Dependências

### Serviços consumidos
- Nenhum (puramente consumidor de eventos Kafka)
- SMTP externo (configurado via `spring.mail.*`)

### Tópicos Kafka consumidos
- `user.registered`
- `user.login.blocked`
- `user.2fa.enabled`
- `order.created`
- `transaction.completed`
- `transaction.failed`
- `transaction.refunded`
- `fraud.detected`

### Tabelas do banco (schema: notification_service)

| Tabela | Propósito |
|--------|-----------|
| `notification_log` | Histórico de todos os emails (id, event_type, recipient_email, status, error_msg, sent_at) |

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/notification/
├── consumer/
│   ├── UserEventConsumer.java          (user.registered, user.login.blocked, user.2fa.enabled)
│   ├── OrderEventConsumer.java         (order.created)
│   ├── TransactionEventConsumer.java   (transaction.completed, failed, refunded)
│   └── FraudEventConsumer.java         (fraud.detected)
├── service/
│   └── EmailService.java               (envia email + grava notification_log)
├── repository/
│   └── NotificationLogRepository.java
├── domain/
│   └── entity/
│       └── NotificationLog.java
├── dto/
│   └── event/                          (Records que mapeiam payload dos eventos Kafka)
│       ├── UserRegisteredEvent.java
│       ├── TransactionCompletedEvent.java
│       └── ...
├── config/
│   ├── MailConfig.java
│   └── KafkaConsumerConfig.java
└── exception/
    └── EmailDeliveryException.java
```

---

## Templates de Email

Localização: `src/main/resources/templates/email/`

```
email/
├── welcome.html                    (user.registered)
├── login-blocked.html              (user.login.blocked)
├── 2fa-enabled.html                (user.2fa.enabled)
├── order-created.html              (order.created)
├── payment-confirmed-customer.html (transaction.completed → cliente)
├── payment-confirmed-merchant.html (transaction.completed → merchant)
├── payment-failed.html             (transaction.failed)
├── refund-confirmed.html           (transaction.refunded)
└── fraud-alert.html                (fraud.detected → security team)
```

---

## Configuração SMTP (application.yml)

```yaml
spring:
  mail:
    host: ${SMTP_HOST}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      mail.smtp.starttls.required: true
      mail.from: noreply@acaboumony.com
```

---

## Estratégia de Testes

| Tipo | Framework | Cenários |
|------|-----------|----------|
| Unitário | JUnit 5 + Mockito | EmailService: envio, retry, idempotência |
| Integração | Testcontainers (PostgreSQL + Kafka) + GreenMail (SMTP fake) | Consumo de evento → envio de email |
| Template | Thymeleaf standalone | Renderização dos templates HTML |

---

## Configuração Docker Compose

```yaml
notification-service:
  image: acaboumony/notification-service:latest
  ports:
    - "8084:8084"
  environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/notification_db
    - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    - SMTP_HOST=${SMTP_HOST}
    - SMTP_USERNAME=${SMTP_USERNAME}
    - SMTP_PASSWORD=${SMTP_PASSWORD}
    - SECURITY_ALERT_EMAIL=${SECURITY_ALERT_EMAIL}
    - APP_BASE_URL=https://app.acaboumony.com
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    - NEW_RELIC_APP_NAME=acaboumony-notification-service
  depends_on:
    - postgres
    - kafka
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| SMTP indisponível | Média | Baixo (não bloqueia pagamento) | Retry 3x + DLQ + log |
| Email bounce (endereço inválido) | Média | Baixo | Gravar como falha permanente, não retentar |
| Volume alto de eventos | Média | Médio | Consumer group com múltiplas instâncias |
