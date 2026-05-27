# Tarefas: Fraud Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 1 | **Sprint:** 1

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo fraud-service — estrutura de pacotes, dependências (Anthropic SDK, Testcontainers) | Infra | ⬜ | |
| 2 | Flyway V1 — tabela `fraud_alerts` | Infra | ⬜ | |
| 3 | Flyway V2 — tabela `ip_blacklist` | Infra | ⬜ | |
| 4 | Entidades JPA: `FraudAlert`, `IpBlacklist`, enum `FraudDecision` | Code | ⬜ | |
| 5 | **[TEST]** Testes unitários de cada `FraudRule` individualmente | Test | ⬜ | RED first — testar cada regra em isolamento |
| 6 | Implementar todas as 9 regras determinísticas (Strategy pattern) | Code | ⬜ | GREEN |
| 7 | **[TEST]** Testes de acumulação de score — múltiplas regras simultâneas | Test | ⬜ | |
| 8 | Implementar `RuleEngineService` (aplicar todas as regras e somar) | Code | ⬜ | |
| 9 | **[TEST]** Testes velocity checks com Redis — 3+ transações em 5 min | Test | ⬜ | |
| 10 | Implementar velocity checks via Redis Sorted Sets | Code | ⬜ | |
| 11 | **[TEST]** Testes CE-001 (primeiro cliente), CE-002 (Claude indisponível), CE-003 (velocity alta) | Test | ⬜ | |
| 12 | Implementar `ClaudeContextAnalyzer` com timeout 250ms e fallback 0 | Code | ⬜ | |
| 13 | **[TEST]** Testes de integração Testcontainers (PostgreSQL + Redis + Kafka) | Test | ⬜ | |
| 14 | Implementar `FraudEventProducer` (Kafka: fraud.detected, fraud.review) | Code | ⬜ | |
| 15 | Implementar `FraudController` — endpoint interno `/internal/fraud/score` | Code | ⬜ | Não exposto via api-gateway |
| 16 | **[TEST]** Testes de API com MockMvc | Test | ⬜ | |
| 17 | Configurar Dockerfile | Infra | ⬜ | |
| 18 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 19 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 20 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] Todas as 9 regras determinísticas cobertas por testes unitários
- [ ] CE-001 a CE-005 cobertos
- [ ] Claude timeout: 250ms → fallback = 0 (sem ajuste)
- [ ] Score nunca enviado ao cliente (apenas `decision`)
- [ ] Endpoint `/internal/fraud/score` não acessível via api-gateway
- [ ] Regras de scoring nunca expostas em logs ou respostas
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev
