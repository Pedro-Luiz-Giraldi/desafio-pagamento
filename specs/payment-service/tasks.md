# Tarefas: Payment Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 1 | **Sprint:** 1–2

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo payment-service — estrutura de pacotes, dependências no pom.xml (MP SDK, Testcontainers) | Infra | ⬜ | |
| 2 | Flyway V1 — tabela `transactions` com índices | Infra | ⬜ | Coordenar schema com Dev 2 |
| 3 | Flyway V2 — tabela `refunds` | Infra | ⬜ | |
| 4 | Flyway V3 — tabela `audit_logs` | Infra | ⬜ | |
| 5 | Entidades JPA: `Transaction`, `Refund`, enums `TransactionStatus`, `RefundReason` | Code | ⬜ | |
| 6 | **[TEST]** Testes unitários `TransactionService` — casos normais (aprovado, recusado) | Test | ⬜ | RED first |
| 7 | Implementar `TransactionService.processTransaction()` | Code | ⬜ | GREEN |
| 8 | **[TEST]** Testes unitários — todos os casos extremos CE-001 a CE-007 da spec | Test | ⬜ | |
| 9 | Implementar idempotência via Redis | Code | ⬜ | |
| 10 | Implementar rate limiting via Redis | Code | ⬜ | |
| 11 | Implementar `FraudServiceClient` (REST para fraud-service) com timeout 250ms | Code | ⬜ | |
| 12 | Implementar `MercadoPagoGateway` (adapter do SDK MP) com WireMock nos testes | Code | ⬜ | |
| 13 | **[TEST]** Testes de integração com Testcontainers (PostgreSQL + Redis + Kafka) | Test | ⬜ | |
| 14 | Implementar `RefundService.refundTransaction()` | Code | ⬜ | |
| 15 | **[TEST]** Testes unitários do RefundService (CE-001 a CE-004) | Test | ⬜ | |
| 16 | Implementar `TransactionService.findById()` + `findByCustomer()` | Code | ⬜ | |
| 17 | **[TEST]** Testes de autorização (acesso negado a transação alheia → 403) | Test | ⬜ | |
| 18 | Implementar `TransactionEventProducer` (Kafka: completed, failed, refunded) | Code | ⬜ | |
| 19 | Implementar `MercadoPagoWebhookConsumer` (receber notificações MP) | Code | ⬜ | |
| 20 | Implementar `TransactionController` + validações Bean Validation | Code | ⬜ | |
| 21 | **[TEST]** Testes de API com MockMvc | Test | ⬜ | |
| 22 | Configurar Dockerfile | Infra | ⬜ | |
| 23 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 24 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 25 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] Todos os CE-001 a CE-007 da spec cobertos por testes
- [ ] Estorno: CE-001 a CE-004 cobertos
- [ ] Cobertura ≥ 90%
- [ ] cardToken nunca aparece em nenhum log (verificado)
- [ ] Idempotência testada (mesma key → mesmo resultado)
- [ ] WireMock simula: MP aprovado, MP recusado, MP timeout
- [ ] Revisado por pelo menos 1 outro dev
