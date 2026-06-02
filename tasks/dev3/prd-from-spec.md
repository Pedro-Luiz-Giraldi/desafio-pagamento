## TDD Mode: REQUIRED

Cada task de implementação DEVE seguir o ciclo RED → GREEN → REFACTOR:
1. RED: Escrever teste falhando baseado na spec (cada CE-* = 1 teste mínimo)
2. GREEN: Implementar o mínimo para o teste passar
3. REFACTOR: Melhorar sem quebrar testes

Nomes de testes seguem o padrão: `deve_<comportamento>_quando_<condição>()`
Jamais usar H2 — usar Testcontainers com PostgreSQL real.

# PRD: Order Service + Notification Service (Sprint 4)

## Objetivo
O order-service gerencia pedidos: criação, consulta, listagem e cancelamento, com ciclo de vida completo e integração a payment-service e Kafka. O notification-service é 100% orientado a eventos Kafka, enviando emails transacionais via SMTP. Esta Sprint cobre as pendências técnicas remanescentes do Sprint 3, melhorias de robustez e resiliência.

## Behavior

### Pendências Técnicas — order-service

#### Fix listOrders para ADMIN
Quando ADMIN usa `statusFilter`, a query passa `customerId=null` em `findByCustomerIdAndStatus(null, status, pageable)`. Como `customer_id` é NOT NULL, o resultado é sempre vazio. Deve adicionar `findByStatus(OrderStatus status, Pageable pageable)` no repositório e usá-lo para o caso ADMIN com statusFilter.

#### Fix listOrders para MERCHANT
1. MERCHANT sem `X-Merchant-Id` cai no branch CUSTOMER (`else`) e busca por `findByCustomerId(userId)`. Deve validar que merchantId está presente para role MERCHANT.
2. `authorizeAccess` para MERCHANT lança NPE quando `merchantId` é null (`order.getMerchantId().equals(merchantId)`). Adicionar null guard.

#### Cache no TransactionEventConsumer
Usar `OrderCacheService.findById()` antes de atualizar status (evita race condition com JPA L1 cache). Atualmente lê direto do `orderRepository`.

#### Fix OrderCacheService
Cache não cacheia dados da entidade — armazena apenas o ID como string e faz DB query no cache hit. Serializar o `Order` como JSON no Redis e desserializar no hit.

#### Documentar API de Pedidos
Springdoc OpenAPI já está no pom.xml mas sem configuração explícita. Adicionar `@OpenAPIDefinition` com info do serviço, tags para agrupamento dos endpoints.

### Pendências Técnicas — notification-service

#### MailConfig.java
Criar configuração explícita do `JavaMailSender` com:
- Pool de conexão SMTP
- Timeouts configuráveis (connect, read, write)
- Propriedades typed em `@ConfigurationProperties`

#### Monitoramento de rate limit
Expor métricas no `/actuator/metrics`:
- Contador de emails enviados com sucesso
- Contador de emails rate-limited
- Gauge de buckets ativos no rate limiter
Usar `MeterRegistry` do Micrometer.

#### Health checks customizados
- `SmtpHealthIndicator`: verificar conectividade SMTP (telnet-style socket connect)
- Aproveitar `KafkaHealthIndicator` auto-configurado do Spring Boot Actuator

### Ambos — Testes de Integração

#### Fluxo: Pedido → Kafka → Email (GreenMail)
Testcontainers com PostgreSQL + Kafka + GreenMail:
1. `POST /orders` → Kafka `order.created` → notification-service → GreenMail → email recebido
2. Expiração de pedido → Kafka `order.cancelled` → notification-service → GreenMail → email recebido

## Casos de Erro (resumo specs)
- DUPLICATE_ORDER (409), EMPTY_ORDER (400), INVALID_ITEM_PRICE (400)
- INVALID_QUANTITY (400), MERCHANT_NOT_FOUND (404), TOTAL_EXCEEDS_LIMIT (400)
- ORDER_NOT_FOUND (404), ORDER_CANNOT_BE_CANCELLED (422), INSUFFICIENT_PERMISSIONS (403)

## Casos Extremos
### order-service
- CE-001: Pedido duplicado (idempotencyKey)
- CE-002: Pedido expira sem pagamento (15 min → CANCELLED)
- CE-003: Merchant inativo ou suspenso
- CE-004: Item com preço zero

### notification-service
- CE-001: Evento duplicado no Kafka (redelivery) — idempotência
- CE-002: Campos ausentes no evento — DLQ
- CE-003: Volume alto (1000+ transações) — rate limiting SMTP
- CE-004: Template corrompido — fallback para texto puro

## Restrições Técnicas
- Stack: Java 21 + Spring Boot 3.4.x + PostgreSQL + Redis + Kafka
- DTOs como Records Java 21
- Resultados como sealed interfaces (Success/Failure)
- Virtual Threads para operações de I/O
- Cobertura mínima: 90% (JaCoCo)
- Nunca logar: customerEmail, cardNumber, CPF
- Performance: P50=30ms criação/listagem, P99=100-150ms

## Efeitos Colaterais Esperados
- Kafka: `order.created`, `order.cancelled` produzidos pelo order-service
- Kafka: `transaction.completed`, `transaction.refunded`, `transaction.failed` consumidos pelo order-service
- Kafka: eventos consumidos pelo notification-service geram emails SMTP
- Redis: idempotency keys com TTL 24h, cache de orders com TTL 60s
- PostgreSQL: orders, order_items, notification_log

## Segurança
- customerId extraído do JWT (header X-User-Id) — nunca do body
- totalInCents calculado no servidor — nunca aceitar do cliente
- Acesso negado → HTTP 403 (nunca 404 para não revelar existência)
- Rate limiting: 50 pedidos/min por customerId
- SMTP com TLS/STARTTLS obrigatório
- Dados sensíveis (cartão, CPF) nunca em emails
- Rate limit: 10 emails/hora/destinatário

## Observações
- Spec order-service contém 9 seções visíveis (seções 1-10, sem seção 11 formal de segurança — registrado como desvio conhecido)
- Spec notification-service contém 13 seções (completa, cobre todas as 11 obrigatórias)
- Todas as tasks DEVEM seguir TDD obrigatório (RED → GREEN → REFACTOR)
- Cobertura mínima 90% com JaCoCo
- PCI check obrigatório ao final
