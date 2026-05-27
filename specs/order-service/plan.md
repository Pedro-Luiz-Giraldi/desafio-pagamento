# Plano Técnico: Order Service

**Spec:** [spec.md](spec.md)
**Status:** Draft
**Responsável:** Dev 3
**Sprint:** 1–2

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| Total do pedido | Calculado no servidor | Aceitar do cliente | Segurança — cliente não pode manipular valor |
| Expiração de pedidos | Spring @Scheduled + status check | Kafka delayed event | Mais simples de implementar e debugar |
| Atualização de status | Via Kafka consumer (transaction.*) | REST callback | Desacoplamento — payment-service não precisa conhecer order-service |
| Idempotência na criação | Redis TTL 24h | DB unique constraint | Consistente com outros serviços |

---

## Dependências

### Serviços consumidos
- Nenhum (criação de pedido não precisa validar produtos externamente no MVP)
- `customerId` extraído do JWT pelo api-gateway

### Tópicos Kafka produzidos
- `order.created` — ao criar pedido (notification-service consome)

### Tópicos Kafka consumidos
- `transaction.completed` → atualizar pedido para PAID
- `transaction.failed` → pedido volta para PENDING (se dentro do prazo)
- `transaction.refunded` → atualizar pedido para REFUNDED / PARTIALLY_REFUNDED

### Tabelas do banco (schema: order_service)

| Tabela | Propósito |
|--------|-----------|
| `orders` | Cabeçalho do pedido (customerId, merchantId, status, total) |
| `order_items` | Itens do pedido (productId, description, quantity, price) |

### Chaves Redis

| Key | TTL | Propósito |
|-----|-----|-----------|
| `idempotency:order:{uuid}` | 24h | Deduplicação de criação |
| `order:{id}` | 60s | Cache de leitura |

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/order/
├── controller/
│   └── OrderController.java
├── service/
│   ├── OrderService.java
│   └── OrderExpirationService.java    (scheduled job)
├── repository/
│   ├── OrderRepository.java
│   └── OrderItemRepository.java
├── domain/
│   ├── entity/
│   │   ├── Order.java
│   │   └── OrderItem.java
│   └── enums/
│       └── OrderStatus.java
├── dto/
│   ├── request/
│   │   └── CreateOrderRequest.java    (Record)
│   └── response/
│       └── OrderResponse.java         (Record)
├── result/
│   └── OrderResult.java               (sealed interface)
├── exception/
│   ├── OrderNotFoundException.java
│   └── OrderCannotBeCancelledException.java
├── event/
│   ├── OrderEventProducer.java        (Kafka producer)
│   └── TransactionEventConsumer.java  (Kafka consumer)
└── mapper/
    └── OrderMapper.java
```

---

## Flyway Migrations

| Versão | Arquivo | Conteúdo |
|--------|---------|---------|
| V1 | `V1__create_orders.sql` | Tabela orders, índices |
| V2 | `V2__create_order_items.sql` | Tabela order_items, FK para orders |

---

## Job de Expiração

```java
@Scheduled(fixedDelay = 60_000) // executa a cada 1 minuto
public void expireStaleOrders() {
    // buscar orders PENDING com expiresAt < now()
    // atualizar para CANCELLED em batch
    // publicar order.cancelled no Kafka
}
```

---

## Estratégia de Testes

| Tipo | Framework | Cenários |
|------|-----------|----------|
| Unitário | JUnit 5 + Mockito | OrderService: criação, cálculo de total, cancelamento |
| Integração | Testcontainers (PostgreSQL + Kafka) | Fluxo completo + consumo de eventos |
| API | MockMvc | Endpoints, autorização, paginação |

---

## Configuração Docker Compose

```yaml
order-service:
  image: acaboumony/order-service:latest
  ports:
    - "8083:8083"
  environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/order_db
    - SPRING_REDIS_HOST=redis
    - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    - ORDER_EXPIRATION_MINUTES=15
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    - NEW_RELIC_APP_NAME=acaboumony-order-service
  depends_on:
    - postgres
    - redis
    - kafka
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Evento `transaction.completed` perdido | Baixa | Alto | Kafka retry + DLQ; reconciliação diária |
| Race condition: 2 pagamentos para mesmo pedido | Baixa | Alto | DB constraint: transactionId é único por orderId |
