# Tarefas: User Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 2 | **Sprint:** 1

> Dev 2 é desbloqueador do time. JWT e SecurityFilterChain precisam estar prontos no Sprint 1 para Dev 1 e Dev 3 avançarem.

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo user-service — estrutura de pacotes, dependências (JJWT, TOTP, BCrypt, Testcontainers) | Infra | ⬜ | |
| 2 | Gerar par de chaves RSA 2048 para JWT (dev: gerado no startup; prod: env var) | Infra | ⬜ | |
| 3 | Flyway V1 — tabela `users` com índice em email | Infra | ⬜ | |
| 4 | Flyway V2 — tabela `merchants` | Infra | ⬜ | |
| 5 | Flyway V3 — tabela `recovery_codes` | Infra | ⬜ | |
| 6 | Flyway V4 — tabela `user_audit_logs` | Infra | ⬜ | |
| 7 | Entidades JPA: `User`, `Merchant`, `RecoveryCode`, enums `UserRole`, `UserStatus` | Code | ⬜ | |
| 8 | **[TEST]** Testes unitários `AuthService` — registro, login sem 2FA, login com 2FA | Test | ⬜ | RED first |
| 9 | Implementar `AuthService.register()` com BCrypt e evento Kafka | Code | ⬜ | GREEN |
| 10 | Implementar `AuthService.authenticate()` com contador de tentativas Redis | Code | ⬜ | |
| 11 | **[TEST]** Testes — CE-001 (email duplicado), CE-002 (token expirado), CE-004 (conta não confirmada) | Test | ⬜ | |
| 12 | Implementar bloqueio de conta após 5 tentativas (Redis) | Code | ⬜ | |
| 13 | Implementar `JwtTokenProvider` (gerar access token RS256) + `JwtTokenValidator` | Code | ⬜ | |
| 14 | **[TEST]** Testes JWT: token válido, expirado, assinatura inválida | Test | ⬜ | |
| 15 | Implementar refresh token (Redis TTL 7 dias, httpOnly cookie) | Code | ⬜ | |
| 16 | **[TEST]** Testes unitários `TwoFactorService` — setup, confirm, verify, recovery | Test | ⬜ | |
| 17 | Implementar `TwoFactorService` (TOTP + 8 recovery codes) | Code | ⬜ | |
| 18 | Implementar CE-001 (usuário perde telefone, recovery code) e CE-003 (brute force TOTP) | Code | ⬜ | |
| 19 | **[TEST]** Testes de integração com Testcontainers (PostgreSQL + Redis + Kafka) | Test | ⬜ | |
| 20 | Implementar `POST /internal/auth/validate-token` com cache Redis 30s | Code | ⬜ | Crítico para api-gateway |
| 21 | Implementar `UserEventProducer` (Kafka: registered, login.blocked, 2fa.enabled) | Code | ⬜ | |
| 22 | Implementar todos os controllers com Bean Validation | Code | ⬜ | |
| 23 | **[TEST]** Testes de API com MockMvc + Spring Security Test | Test | ⬜ | |
| 24 | Configurar `SecurityFilterChain` (rotas públicas vs. autenticadas) | Code | ⬜ | Compartilhado com outros módulos |
| 25 | Configurar Dockerfile | Infra | ⬜ | |
| 26 | Configurar entrada no docker-compose.yml | Infra | ⬜ | |
| 27 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 28 | **[SYNC]** Validar contrato JWT com Dev 1 (claims, como validar token no payment-service) | Sync | ⬜ | Sprint 1, Dia 3 |
| 29 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão

- [ ] CE-001 a CE-004 do login cobertos por testes
- [ ] Timing attack prevention validado (bcrypt comparison)
- [ ] `password` nunca aparece em nenhum log
- [ ] `refreshToken` apenas em httpOnly cookie, nunca no body
- [ ] 2FA: todos os 5 endpoints funcionando
- [ ] `/internal/auth/validate-token` com cache Redis (Dev 2 valida com Dev 1)
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev
