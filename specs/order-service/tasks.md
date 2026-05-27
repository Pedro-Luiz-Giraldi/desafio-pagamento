# Tarefas: Order Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 3 | **Sprint:** 1–2

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo order-service — estrutura de pacotes, dependências | Infra | ⬜ | |
| 2 | Flyway V1 — tabela `orders` com índices (customerId, merchantId, status) | Infra | ⬜ | Coordenar com Dev 2 |
| 3 | Flyway V2 — tabela `order_items` com FK para orders | Infra | ⬜ | |
| 4 | Entidades JPA: `Order`, `OrderItem`, enum `OrderStatus` | Code | ⬜ | |
| 5 | **[TEST]** Testes unitários `OrderService` — criação, cálculo de total, validações | Test | ⬜ | RED first |
| 6 | Implementar `OrderService.createOrder()` com cálculo de total no servidor | Code | ⬜ | GREEN |
| 7 | **[TEST]** Testes — CE-001 (duplicado), CE-002 (expiração), CE-003 (merchant inativo), CE-004 (preço zero) | Test | ⬜ | |
| 8 | Implementar idempotência via Redis | Code | ⬜ | |
| 9 | **[TEST]** Testes de autorização — CE-002 acesso cruzado → 403 | Test | ⬜ | |
| 10 | Implementar cancelamento de pedido (somente PENDING) | Code | ⬜ | |
| 11 | **[TEST]** Testes de integração Testcontainers (PostgreSQL + Redis + Kafka) | Test | ⬜ | |
| 12 | Implementar `OrderExpirationService` (@Scheduled — cancela PENDING expirados) | Code | ⬜ | |
| 13 | Implementar `TransactionEventConsumer` (Kafka: completed, failed, refunded) | Code | ⬜ | |
| 14 | **[TEST]** Testes do consumer Kafka — transição de estados ao receber eventos | Test | ⬜ | |
| 15 | Implementar `OrderEventProducer` (Kafka: order.created) | Code | ⬜ | |
| 16 | Implementar `OrderController` + Bean Validation + paginação | Code | ⬜ | |
| 17 | **[TEST]** Testes de API com MockMvc | Test | ⬜ | |
| 18 | **[SYNC]** Validar contrato POST /orders com Dev 1 (payment-service precisa do orderId) | Sync | ⬜ | Sprint 1, Dia 5 |
| 19 | Configurar Dockerfile | Infra | ⬜ | |
| 20 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 21 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 22 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] Total do pedido sempre calculado no servidor (nunca aceito do cliente)
- [ ] CE-001 a CE-004 cobertos
- [ ] Expiração de pedidos testada (job de 15 min)
- [ ] Transições de status via Kafka testadas (PENDING → PAID, REFUNDED)
- [ ] Autorização testada (403 para acesso cruzado)
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev
