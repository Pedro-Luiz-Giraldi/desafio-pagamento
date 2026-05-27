# Tarefas: Notification Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 3 | **Sprint:** 2

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo notification-service — estrutura de pacotes, dependências (Thymeleaf, Spring Mail, Testcontainers + GreenMail) | Infra | ⬜ | |
| 2 | Flyway V1 — tabela `notification_log` | Infra | ⬜ | |
| 3 | Entidade JPA `NotificationLog` | Code | ⬜ | |
| 4 | Criar todos os templates HTML Thymeleaf (8 templates listados na spec) | Code | ⬜ | Criar primeiro o welcome.html para testar o pipeline |
| 5 | **[TEST]** Testes unitários `EmailService` — envio, retry, idempotência | Test | ⬜ | RED first |
| 6 | Implementar `EmailService` com Spring JavaMailSender + retry backoff | Code | ⬜ | GREEN |
| 7 | **[TEST]** Testes de idempotência — mesmo evento entregue 2x → apenas 1 email | Test | ⬜ | |
| 8 | Implementar deduplicação de eventos via `notification_log` | Code | ⬜ | |
| 9 | **[TEST]** Testes — CE-002 (campos ausentes → DLQ), CE-003 (volume alto) | Test | ⬜ | |
| 10 | Implementar `UserEventConsumer` (registered, login.blocked, 2fa.enabled) | Code | ⬜ | |
| 11 | **[TEST]** Integração: Testcontainers (PostgreSQL + Kafka) + GreenMail (SMTP fake) | Test | ⬜ | |
| 12 | Implementar `OrderEventConsumer` (order.created) | Code | ⬜ | |
| 13 | Implementar `TransactionEventConsumer` (completed → 2 emails, failed, refunded) | Code | ⬜ | |
| 14 | Implementar `FraudEventConsumer` (fraud.detected → email security team) | Code | ⬜ | |
| 15 | Configurar DLQ para eventos que falham 3x | Code | ⬜ | |
| 16 | Configurar Dockerfile | Infra | ⬜ | |
| 17 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 18 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 19 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] Todos os 8 tipos de email funcionando (testados com GreenMail)
- [ ] Idempotência: evento duplicado → não envia email duplicado
- [ ] Dados sensíveis nunca incluídos em emails (cartão, CPF, senha)
- [ ] DLQ configurada para eventos problemáticos
- [ ] SMTP configurado via env vars (nunca hardcoded)
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev
