# Tarefas: User Service

**Spec:** [spec.md](spec.md) | **Plano:** [plan.md](plan.md)
**Responsável:** Dev 2 | **Sprint:** 1
**Atualizado:** 2026-05-29 (Sessão Grill)

> Dev 2 é desbloqueador do time. JWT e SecurityFilterChain precisam estar prontos no Sprint 1 para os outros serviços avançarem.

---

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo: estrutura de pacotes, dependências (JJWT RS256, dev.samstevens.totp, BCrypt, Testcontainers, Bean Validation) | Infra | ⬜ | |
| 2 | Gerar par de chaves RSA 2048 para dev e adicionar ao `.env.example` como `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` | Infra | ⬜ | **Chave fixa para dev — nunca gerada no startup** |
| 3 | Adicionar `INTERNAL_SECRET` e `TOTP_AES_KEY` ao `.env.example` | Infra | ⬜ | |
| 4 | Flyway V1 — enums `user_role`, `user_status`; tabela `users` com `merchant_id` nullable FK; índices em `email` | Infra | ⬜ | Sem FK para merchants ainda (dependência circular) |
| 5 | Flyway V2 — enum `merchant_status`; tabela `merchants` com `owner_id` FK → users; `ALTER TABLE users ADD CONSTRAINT fk_merchant` | Infra | ⬜ | Resolve dependência circular V1/V2 |
| 6 | Flyway V3 — tabela `recovery_codes` com FK → users | Infra | ⬜ | |
| 7 | Flyway V4 — tabela `user_audit_logs`; índice em `user_id` e `created_at` | Infra | ⬜ | |
| 8 | Enums: `UserRole` (CUSTOMER, MERCHANT_OWNER, STAFF), `UserStatus`, `MerchantStatus` | Code | ⬜ | |
| 9 | Entidades JPA: `User` (com `role` enum + `merchantId` FK nullable), `Merchant` (com `ownerId` FK), `RecoveryCode` | Code | ⬜ | |
| 10 | `CnpjValidator` — Bean Validation custom: formato 14 dígitos + algoritmo Módulo 11 | Code | ⬜ | |
| 11 | **[TEST RED]** Testes unitários `AuthService.register()` — CUSTOMER, MERCHANT_OWNER atômico, email duplicado, CNPJ inválido, CNPJ duplicado, role STAFF rejeitada | Test | ⬜ | TDD — escrever antes do código |
| 12 | Implementar `AuthService.register()` — BCrypt, criação atômica merchant+user para MERCHANT_OWNER, evento Kafka `user.registered` | Code | ⬜ | GREEN |
| 13 | **[TEST RED]** Testes unitários `AuthService.authenticate()` — login sucesso, conta bloqueada, email não confirmado, CE-001 a CE-004 | Test | ⬜ | TDD |
| 14 | Implementar `AuthService.authenticate()` — contador de tentativas Redis, bloqueio, timing attack prevention | Code | ⬜ | GREEN |
| 15 | Implementar `JwtTokenProvider` (gerar access token RS256 com claims: sub, email, role, merchantId) | Code | ⬜ | |
| 16 | Implementar `JwtTokenValidator` (verificar assinatura RS256, expiração, claims) | Code | ⬜ | |
| 17 | **[TEST RED]** Testes JWT: token válido, expirado, assinatura inválida, claims corretos por role | Test | ⬜ | TDD |
| 18 | **[TEST RED]** Testes refresh token: rotação obrigatória, token antigo invalidado, token inexistente, token expirado | Test | ⬜ | TDD |
| 19 | Implementar refresh token — rotação: deletar antigo + gerar novo UUID + Redis TTL 7 dias + httpOnly cookie | Code | ⬜ | GREEN — rotação é obrigatória |
| 20 | **[TEST RED]** Testes unitários `TwoFactorService` — setup, confirm, verify, recovery, brute force TOTP | Test | ⬜ | TDD |
| 21 | Implementar `TwoFactorService` — TOTP (dev.samstevens.totp), AES-256-GCM p/ secret, 8 recovery codes BCrypt | Code | ⬜ | GREEN |
| 22 | Implementar `InternalSecretFilter` — valida header `X-Internal-Secret` nas rotas `/internal/**`; retorna 403 se ausente/inválido | Code | ⬜ | Crítico para api-gateway |
| 23 | Implementar `POST /internal/auth/validate-token` — valida JWT RS256, retorna userId/email/role/merchantId | Code | ⬜ | Crítico para api-gateway |
| 24 | Implementar `UserEventProducer` — Kafka: user.registered, user.login.blocked, user.2fa.enabled, user.login.success | Code | ⬜ | |
| 25 | Implementar todos os controllers com Bean Validation e `@RestControllerAdvice` | Code | ⬜ | |
| 26 | Configurar `SecurityFilterChain` — rotas públicas (`/auth/**`), internas (`/internal/**` + InternalSecretFilter), autenticadas (`/users/**`) | Code | ⬜ | Compartilhado com api-gateway |
| 27 | **[TEST]** Testes de integração Testcontainers (PostgreSQL + Redis + Kafka) — fluxo completo registro → confirm → login → refresh (com rotação) → logout | Test | ⬜ | |
| 28 | **[TEST]** Testes API MockMvc + Spring Security Test — X-Internal-Secret ausente/inválido, STAFF tentando checkout, JWT inválido | Test | ⬜ | |
| 29 | Configurar Dockerfile (multi-stage, usuário não-root) | Infra | ⬜ | |
| 30 | Atualizar `docker-compose.yml` — adicionar `INTERNAL_SECRET`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `TOTP_AES_KEY` | Infra | ⬜ | |
| 31 | Validar cobertura JaCoCo ≥ 90% | Validate | ⬜ | |
| 32 | **[SYNC]** Validar contrato JWT com Dev 1 — claims esperados no payment-service; validar `X-Internal-Secret` com Dev 2 api-gateway | Sync | ⬜ | Sprint 1, Dia 3 |
| 33 | PR + code review contra spec | Review | ⬜ | |

---

## Checklist de Conclusão — Sprint 1

- [ ] Registro CUSTOMER e MERCHANT_OWNER (atômico) funcionando
- [ ] CNPJ com validação de formato e dígitos verificadores
- [ ] STAFF rejeitado no endpoint de registro (apenas via convite — Sprint 2)
- [ ] Login com rate limiting: 5 tentativas → bloqueio 30 min
- [ ] Timing attack prevention validado
- [ ] Refresh token com rotação obrigatória
- [ ] `password`, `cnpj`, `totpCode` nunca aparecem em nenhum log
- [ ] `refreshToken` apenas em httpOnly cookie, nunca no body
- [ ] 2FA: todos os 5 endpoints funcionando
- [ ] `X-Internal-Secret` protegendo `/internal/auth/validate-token`
- [ ] `INTERNAL_SECRET` e chave RSA no `.env.example` (nunca commitados com valor real)
- [ ] Cobertura ≥ 90%
- [ ] Revisado por pelo menos 1 outro dev

---

## Backlog Sprint 2

- [ ] `POST /auth/resend-confirmation` — reenvio de email expirado
- [ ] `POST /api/v1/merchants/staff/invite` — convite de STAFF pelo OWNER
- [ ] `PATCH /me` — alterar email (com reconfirmação) e senha (com senha atual)
- [ ] KYC — validação de CNPJ na Receita Federal
