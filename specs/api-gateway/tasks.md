# Tarefas: API Gateway

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 2 | **Sprint:** 1

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo api-gateway — dependências (Spring Cloud Gateway, Resilience4j, Spring Data Redis) | Infra | ⬜ | |
| 2 | Implementar `CorrelationIdFilter` (injeta X-Correlation-Id em todo request) | Code | ⬜ | |
| 3 | **[TEST]** Testes unitários `CorrelationIdFilter` | Test | ⬜ | RED first |
| 4 | Implementar `AuthenticationFilter` (valida JWT via user-service + cache Redis 30s) | Code | ⬜ | GREEN |
| 5 | **[TEST]** Testes AuthFilter: JWT ausente → 401, expirado → 401, válido → repassa headers | Test | ⬜ | |
| 6 | Implementar rotas de roteamento (`RouteLocator`) para todos os 3 serviços | Code | ⬜ | |
| 7 | Configurar rate limiting Redis Token Bucket por rota | Code | ⬜ | |
| 8 | **[TEST]** Testes rate limit: dentro do limite → OK, acima → 429 com Retry-After | Test | ⬜ | |
| 9 | Configurar circuit breaker Resilience4j por serviço downstream | Code | ⬜ | |
| 10 | **[TEST]** Testes circuit breaker: serviço down → 503 com mensagem de retry | Test | ⬜ | |
| 11 | Implementar `LoggingFilter` (loga request/response sem body/token) | Code | ⬜ | |
| 12 | Configurar CORS | Code | ⬜ | |
| 13 | Implementar bloqueio de `/internal/**` — retorna 404 externamente | Code | ⬜ | |
| 14 | Implementar `GatewayExceptionHandler` (formata erros no envelope padrão) | Code | ⬜ | |
| 15 | **[TEST]** Testes de integração com MockServer (simular serviços downstream) | Test | ⬜ | |
| 16 | Adicionar headers de segurança em todas as respostas | Code | ⬜ | HSTS, X-Content-Type-Options, etc. |
| 17 | Configurar Dockerfile | Infra | ⬜ | |
| 18 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 19 | **[SYNC]** Validar headers X-User-* com Dev 1 (payment-service usa X-User-Id) | Sync | ⬜ | Sprint 1, Dia 3 |
| 20 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 21 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] Rotas públicas acessíveis sem JWT
- [ ] Rotas privadas retornam 401 sem token válido
- [ ] Rate limit funcionando para todos os endpoints
- [ ] Circuit breaker testado (serviço mockado falhando)
- [ ] `/internal/**` bloqueado externamente (retorna 404)
- [ ] X-Correlation-Id presente em todas as respostas
- [ ] Headers de segurança validados
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev
