# Sprint 4 — Relatório de Progresso

**Responsável:** Dev 3
**Serviços:** `order-service` (porta 8083), `notification-service` (porta 8084)
**Período:** Sprint 4
**Status:** Concluído ✅

---

## O que foi feito

### 1. Fix `listOrders` — ADMIN (order-service)

| Antes | Depois |
|-------|--------|
| ADMIN com `statusFilter` passava `customerId=null` para `findByCustomerIdAndStatus` | ADMIN usa `findByStatus(status)`, que retorna pedidos de qualquer cliente no status |
| MERCHANT sem `merchantId` no JWT lançava NPE | Validação explícita: MERCHANT sem `merchantId` lança `InsufficientPermissionsException` |

**Alterações:**
- `OrderRepository.java`: adicionado método `findByStatus(OrderStatus status)`
- `OrderService.listOrders()`: ADMIN com `statusFilter` → `findByStatus`; ADMIN sem filtro → `findAll()`
- `OrderService.listOrders()`: MERCHANT com `merchantId=null` → `InsufficientPermissionsException`
- `OrderService.authorizeAccess()`: guarda NPE para `merchantId` nulo

### 2. Cache no `TransactionEventConsumer` (order-service)

| Antes | Depois |
|-------|--------|
| Consumer lia do `orderRepository.findById()` e depois chamava `orderCacheService.evict()` | Consumer lê do `orderCacheService.findById()` (cache-aside) e depois `orderCacheService.cacheOrder()` diretamente |
| Após salvar, fazia `orderCacheService.evict()` | Agora escreve direto no cache (`cacheOrder()`), eliminando race condition com JPA L1 cache |

**Alterações:**
- `OrderCacheService`: serialização JSON via Jackson ObjectMapper (não serialização Java nativa)
- `OrderItem.getOrder()`: adicionado `@JsonIgnore` para quebrar referência circular na serialização
- `TransactionEventConsumer`: injeta `OrderCacheService` (não `OrderRepository`)
- `OrderCacheService` tem 7 testes unitários (cache hit, miss, JSON inválido, evict, manual cache, serialization error)

### 3. `MailConfig.java` + `SmtpHealthIndicator` (notification-service)

- Criado `MailConfig.java` — configuração explícita do `JavaMailSenderImpl` com:
  - Timeouts configuráveis (connection, read, write = 5s)
  - Pool de conexão SMTP
  - TLS obrigatório (`mail.smtp.starttls.required=true`)
  - Auth condicional (só configura username/password se preenchido)
- Criado `SmtpHealthIndicator` — health check customizado que testa conectividade SMTP via socket TCP
  - Registrado no Spring Actuator como `health/smtp`

### 4. Métricas de Rate Limit com Micrometer (notification-service)

| Antes | Depois |
|-------|--------|
| `EmailRateLimiter` sem métricas | `EmailRateLimiter` com `MeterRegistry` |
| `EmailService` sem contadores | `EmailService` com contador `notification.email.sent` |

**Métricas expostas no `/actuator/metrics`:**
- `notification.email.sent` (counter) — total de emails enviados com tag `eventType`
- `notification.email.rate.limited` (counter) — total de rate limited por `recipient`
- `notification.email.active.buckets` (gauge) — número de buckets ativos

### 5. OpenAPI/Swagger Documentation (order-service)

- Criado `OpenApiConfig.java` com `@OpenAPIDefinition`
  - title: "Order Service API"
  - description: "API for managing orders in the Acabou o Mony payment platform"
  - version: "1.0.0"
  - Contact + License metadata
- Documentação disponível em `/v3/api-docs` e `/swagger-ui/index.html` (via springdoc-openapi)

### 6. Testes de Integração (ambos — @Disabled)

- Criado `OrderCreatedEmailIntegrationIT.java` — teste de integração com Testcontainers + GreenMail
  - Fluxo: pedido criado → Kafka `order.created` → notification-service → email recebido no GreenMail
  - Marcado com `@Disabled` e `@Tag("integration")` — requer Docker (Testcontainers)
  - Sufixo `*IT.java` — não é coletado pelo surefire (apenas `*Test.java`)
  - Será habilitado quando ambiente CI com Docker estiver disponível

---

## Resultado dos Testes

### order-service — 79 testes ✅ (↑ de 71)

| Test Class | Tests | Novos neste sprint |
|-----------|-------|--------------------|
| `OrderServiceTest` | 30 | Testes para ADMIN statusFilter, MERCHANT sem merchantId, authorizeAccess NPE |
| `OrderCacheServiceTest` | 7 | **Novo** — cache hit/miss/JSON inválido/evict/manual cache/serialization error |
| `TransactionEventConsumerTest` | 9 | Atualizado para usar `OrderCacheService` em vez de `OrderRepository` |
| `OrderControllerTest` | 11 | — |
| `GlobalExceptionHandlerTest` | 9 | — |
| `OrderExpirationServiceTest` | 3 | — |
| `IdempotencyServiceTest` | 7 | — |
| `OrderEventProducerTest` | 2 | — |
| `OpenApiConfigTest` | 1 | **Novo** — anotação OpenAPI |
| **Total** | **79** | |

### notification-service — 32 testes ✅ (↑ de 29)

| Test Class | Tests | Novos neste sprint |
|-----------|-------|--------------------|
| `EmailServiceTest` | 7 | Atualizado para novo construtor com `MeterRegistry` |
| `EmailServiceTest$TemplateFallback` | 1 | — |
| `EmailServiceNullRecipientTest` | 2 | — |
| `EmailRateLimiterTest` | 9 | +3 novos — counter rate.limited, gauge active.buckets, counter por recipient |
| `UserEventConsumerTest` | 3 | — |
| `TransactionEventConsumerTest` | 3 | — |
| `OrderEventConsumerTest` | 3 | — |
| `FraudEventConsumerTest` | 2 | — |
| `KafkaConsumerConfigTest` | 2 | — |
| **Total** | **32** | |

### Cobertura JaCoCo

| Serviço | Cobertura | Mínimo | Status |
|---------|-----------|--------|--------|
| order-service | 92.3% | 90% | ✅ |
| notification-service | 94.5% (efetiva) | 90% | ✅ |

**Classes excluídas do JaCoCo check:**
- `order-service`: domain/entity, dto, exception, Application
- `notification-service`: domain/entity, dto, config, exception, Application

---

## Novos Arquivos Criados

### order-service
```
src/main/java/com/acaboumony/order/config/OpenApiConfig.java            # OpenAPI definition
src/test/java/com/acaboumony/order/service/OrderCacheServiceTest.java    # 7 testes de cache
src/test/java/com/acaboumony/order/config/OpenApiConfigTest.java         # 1 teste de anotação
```

### notification-service
```
src/main/java/com/acaboumony/notification/config/MailConfig.java         # JavaMailSender explícito
src/main/java/com/acaboumony/notification/config/SmtpHealthIndicator.java # Health check SMTP
src/test/java/com/acaboumony/notification/integration/OrderCreatedEmailIntegrationIT.java # Testcontainers (disabled)
```

### Testes atualizados

| Arquivo | Mudança |
|---------|---------|
| `OrderServiceTest.java` | +3 testes: ADMIN statusFilter, MERCHANT sem merchantId, authorizeAccess NPE |
| `EmailRateLimiterTest.java` | +3 testes: métricas Micrometer (counter + gauge) |
| `EmailServiceTest.java` | Construtor atualizado com `MeterRegistry` |
| `TransactionEventConsumerTest.java` | Substituído `OrderRepository` mock por `OrderCacheService` mock |

---

## Decisões Técnicas do Sprint 4

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Cache serialização | Jackson ObjectMapper | Evita dependência de serialização Java (incompatível entre versões) |
| Cache no consumer | `cacheOrder()` direto em vez de `save()` + `evict()` | Elimina race condition com JPA L1 cache |
| `findByStatus()` | Método novo no Repository | ADMIN precisa de query diferente de MERCHANT; evita lógica complexa no service |
| MailConfig | `JavaMailSenderImpl` explícito | Timeouts conectivos evitam hang na inicialização quando SMTP está indisponível |
| SmtpHealthIndicator | Socket TCP simples | Não depende de JavaMailSender (que poderia estar mal configurado) |
| Integration tests | `@Disabled` + `@Tag("integration")` + sufixo `*IT.java` | Bloqueia execução automática quando Docker não está disponível |
| OpenApiConfig | Anotação pura (`@OpenAPIDefinition`) | Sem dependência de configuração programática; springdoc auto-configura o resto |

---

## PCI DSS + LGPD Security Check

**Resultado:** 0 críticos ✅ — relatório em `qa-output/dev3/pci-report.md`

| Categoria | Status |
|-----------|--------|
| Dados sensíveis em logs | OK (apenas emails — aviso LGPD documentado) |
| Armazenamento de dados sensíveis | OK (sem cardNumber, CVV, CPF no escopo) |
| JWT configuração | OK (não aplicável) |
| SQL injection | OK (sem queries nativas) |
| TLS/comunicação | OK (SMTP com starttls) |

---

## Gaps Resolvidos (do Sprint 3)

| # | Gap | Sprint 3 | Sprint 4 |
|---|-----|----------|----------|
| 1 | `listOrders` ADMIN com `statusFilter` | Aberto | ✅ Corrigido |
| 2 | `listOrders` MERCHANT com `merchantId=null` | Aberto | ✅ Corrigido |
| 3 | Testes de integração com Testcontainers | Aberto | ✅ Criado (@Disabled) |
| 4 | `TransactionEventConsumer` sem cache | Aberto | ✅ Corrigido |
| 5 | `MailConfig.java` inexistente | Aberto | ✅ Criado |

---

## Gaps Conhecidos (para Sprint 5)

| # | Serviço | Problema | Prioridade |
|---|---------|----------|------------|
| 1 | ambos | Sem integração real com Docker/Testcontainers (testes `@Disabled`) | Média |
| 2 | notification | `UserEventConsumer` loga email completo em INFO — LGPD (aceito para diagnóstico) | Baixa |
| 3 | order | spec.md faltando seção 11 (Safety) | Baixa |
| 4 | notification | `EmailRateLimiter.shutdown()` e métodos internos (`cleanup()`) sem cobertura de teste | Baixa |

---

## Artefatos

- `tasks/dev3/prd-from-spec.md` — PRD consolidado da Sprint 4
- `tasks/dev3/task-01-*.md` a `task-06-*.md` — Definições das tasks
- `tasks/dev3/sdd-final-report.md` — Relatório final SDD+TDD
- `qa-output/dev3/pci-report.md` — Relatório PCI DSS + LGPD
- `services/order-service/target/site/jacoco/index.html` — Relatório JaCoCo order-service
- `services/notification-service/target/site/jacoco/index.html` — Relatório JaCoCo notification-service

---

## Estado Geral do Projeto (todos os serviços)

| Serviço | Porta | Spec | Tasks | Testes | Status |
|---------|-------|------|-------|--------|--------|
| `api-gateway` | 8080 | ✅ specs/api-gateway | tasks.md | — | Pendente |
| `user-service` | 8081 | ✅ specs/user-service | tasks.md | ~90% cobertura | Em andamento |
| `payment-service` | 8082 | ✅ specs/payment-service | tasks.md | — | Em andamento |
| `order-service` | 8083 | ✅ specs/order-service | ✅ 79 testes, 92.3% | JaCoCo | ✅ Completo |
| `notification-service` | 8084 | ✅ specs/notification-service | ✅ 32 testes, 94.5% | JaCoCo (efetiva) | ✅ Completo |
| `fraud-service` | 8085 | ✅ specs/fraud-service | tasks.md | — | Em andamento |
