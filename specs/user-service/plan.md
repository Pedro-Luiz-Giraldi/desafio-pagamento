# Plano Técnico: User Service

**Spec:** [spec.md](spec.md)
**Status:** Atualizado — Sessão Grill 2026-05-29
**Responsável:** Dev 2
**Sprint:** 1

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| JWT signing | RS256 (chave assimétrica) | HS256 | Chave pública compartilhável sem expor secret |
| Chave RSA em dev | Fixa no `.env.example` | Gerada no startup | Gerar no startup invalida tokens a cada restart — improdutivo em dev |
| Password hashing | BCrypt rounds=12 | Argon2 | Padrão Spring Security; equilibra segurança/latência |
| Refresh token storage | Redis (TTL 7 dias) + rotação | DB sem rotação | Revogação instantânea + segurança contra token roubado |
| Refresh token rotação | Obrigatória a cada refresh | Sem rotação | Token roubado fica inválido após primeiro uso legítimo |
| 2FA library | dev.samstevens.totp:1.7.x | Google Auth Library | Bem mantida, RFC 6238 compliant |
| TOTP secret encryption | AES-256-GCM | AES-256-CBC | GCM inclui autenticação (MAC), mais seguro |
| Email confirmation | Token UUID no Redis (TTL 24h) | Token JWT | Mais fácil de invalidar; JWT não pode ser revogado facilmente |
| Role storage | Coluna enum única `role` | Tabela user_roles | Roles são mutuamente exclusivos; sem necessidade de join |
| Merchant model | Entidade separada com múltiplos usuários | Campo simples em users | Merchant tem OWNER + STAFF; relacionamento 1:N |
| MERCHANT_OWNER registration | Atômico: cria users + merchants na mesma transação | Dois passos separados | Sem estado intermediário; sem usuário sem merchant ou vice-versa |
| CNPJ validation | Formato + dígitos verificadores | + Receita Federal API | Dependência externa não essencial no Sprint 1; KYC em sprint futuro |
| Internal endpoint security | X-Internal-Secret header | mTLS / só isolamento de rede | Simples de implementar com Docker Compose; sem complexidade de certificados |
| PATCH /me (Sprint 1) | Só fullName | Todos os campos | Alterar email/senha requer fluxos complexos; fullName não tem restrições |

---

## Modelo de Roles

```
UserRole enum:
  CUSTOMER       → compra; sem merchant_id
  MERCHANT_OWNER → compra + gerencia merchant; merchant_id preenchido
  STAFF          → só opera dashboard; não pode comprar; merchant_id preenchido
                   (criado via convite do OWNER — Sprint 2)
```

**Regra de negócio (no código, não no banco):**
- `MERCHANT_OWNER` tem acesso a todos os endpoints de compra de `CUSTOMER`
- `STAFF` não tem acesso ao checkout

---

## Dependências

### Serviços consumidos
- Nenhum (user-service é desbloqueador do time)

### Tópicos Kafka produzidos
- `user-events` (tópico único com tipo no payload):
  - `user.registered` — ao criar conta (inclui `merchantId` para MERCHANT_OWNER)
  - `user.login.blocked` — ao bloquear conta por tentativas excessivas
  - `user.2fa.enabled` — ao ativar 2FA
  - `user.login.success` — ao logar com sucesso (analytics de segurança)

### Tabelas do banco (schema: `user_db`)

#### `users`
| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| password_hash | VARCHAR(60) | NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| role | user_role_enum | NOT NULL |
| merchant_id | UUID | FK → merchants(id), NULLABLE |
| status | user_status_enum | NOT NULL DEFAULT 'PENDING_EMAIL_CONFIRMATION' |
| totp_enabled | BOOLEAN | NOT NULL DEFAULT false |
| totp_secret_encrypted | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

#### `merchants`
| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| company_name | VARCHAR(100) | NOT NULL |
| cnpj | VARCHAR(14) | UNIQUE NOT NULL |
| owner_id | UUID | FK → users(id), NOT NULL |
| status | merchant_status_enum | NOT NULL DEFAULT 'ACTIVE' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

#### `recovery_codes`
| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users(id) NOT NULL |
| code_hash | VARCHAR(60) | NOT NULL |
| used | BOOLEAN | NOT NULL DEFAULT false |
| used_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

#### `user_audit_logs`
| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users(id), NULLABLE (para tentativas com email inexistente) |
| event_type | VARCHAR(50) | NOT NULL (LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED, 2FA_ENABLED, etc.) |
| ip_address | VARCHAR(45) | NULLABLE |
| device_fingerprint | VARCHAR(255) | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

### Chaves Redis

| Key | TTL | Propósito |
|-----|-----|-----------|
| `refresh_token:{userId}:{tokenId}` | 7 dias | Refresh tokens válidos (deletado na rotação) |
| `login_attempts:{email}` | 30 min | Contador de tentativas falhas |
| `account_locked:{email}` | 30 min | Flag de bloqueio |
| `email_confirm:{token}` | 24h | Tokens de confirmação de email |
| `2fa_setup:{userId}` | 10 min | Secret TOTP temporário durante setup |
| `2fa_login:{twoFactorToken}` | 5 min | Token temporário do fluxo 2FA |

> Cache de `token_validation` fica no **api-gateway**, não aqui.

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/user/
├── controller/
│   ├── AuthController.java
│   ├── TwoFactorController.java
│   └── UserController.java
├── service/
│   ├── AuthService.java
│   ├── TwoFactorService.java
│   ├── MerchantService.java        ← novo: criação atômica de merchant
│   └── UserService.java
├── repository/
│   ├── UserRepository.java
│   ├── MerchantRepository.java     ← novo
│   └── RecoveryCodeRepository.java
├── domain/
│   ├── entity/
│   │   ├── User.java
│   │   ├── Merchant.java           ← atualizado: owner_id FK
│   │   └── RecoveryCode.java
│   └── enums/
│       ├── UserRole.java           ← atualizado: CUSTOMER, MERCHANT_OWNER, STAFF
│       ├── UserStatus.java
│       └── MerchantStatus.java     ← novo
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java          (Record — campos condicionais MERCHANT_OWNER)
│   │   ├── LoginRequest.java             (Record)
│   │   ├── UpdateProfileRequest.java     (Record — só fullName Sprint 1)
│   │   ├── TwoFactorConfirmRequest.java  (Record)
│   │   └── TwoFactorVerifyRequest.java   (Record)
│   └── response/
│       ├── RegisterResponse.java         (Record — inclui merchantId nullable)
│       ├── AuthResponse.java             (Record)
│       ├── TwoFactorSetupResponse.java   (Record)
│       └── UserProfileResponse.java      (Record)
├── result/
│   └── AuthResult.java                   (sealed: Success | RequiresTwoFactor | Failure)
├── exception/
│   ├── InvalidCredentialsException.java
│   ├── AccountLockedException.java
│   ├── InvalidTotpCodeException.java
│   ├── EmailAlreadyExistsException.java
│   ├── InvalidCnpjException.java         ← novo
│   └── MissingMerchantDataException.java ← novo
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   └── RedisConfig.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtTokenValidator.java
│   └── InternalSecretFilter.java         ← novo: valida X-Internal-Secret
├── event/
│   └── UserEventProducer.java
├── validation/
│   └── CnpjValidator.java                ← novo: Bean Validation custom
└── mapper/
    └── UserMapper.java
```

---

## Flyway Migrations

| Versão | Arquivo | Conteúdo |
|--------|---------|---------|
| V1 | `V1__create_users.sql` | Enum user_role, user_status; tabela users; índices em email e merchant_id |
| V2 | `V2__create_merchants.sql` | Enum merchant_status; tabela merchants; índice em cnpj; FK owner_id → users |
| V3 | `V3__create_recovery_codes.sql` | Tabela recovery_codes; FK user_id → users |
| V4 | `V4__create_audit_logs.sql` | Tabela user_audit_logs; índice em user_id e created_at |

> **Nota:** V2 tem dependência circular (merchants.owner_id → users; users.merchant_id → merchants). Resolver com:
> 1. V1 cria `users` sem FK para merchants
> 2. V2 cria `merchants` com FK owner_id → users
> 3. `ALTER TABLE users ADD CONSTRAINT fk_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)` no final do V2

---

## JWT — Estrutura dos Claims

```json
{
  "sub": "userId-uuid",
  "email": "ana@loja.com.br",
  "role": "MERCHANT_OWNER",
  "merchantId": "merchant-uuid-ou-null",
  "iat": 1748350860,
  "exp": 1748351760
}
```

- Chave RSA 2048 bits
- Access token: **15 min** (900 segundos)
- Refresh token: **7 dias** — UUID opaque, não JWT

**Dev:** chave fixa no `.env.example`
**Prod:** obrigatório via `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` (base64 encoded PEM)

---

## Variáveis de Ambiente

| Variável | Descrição | Dev |
|----------|-----------|-----|
| `JWT_PRIVATE_KEY` | RSA private key PEM (base64) | Fixa no `.env.example` |
| `JWT_PUBLIC_KEY` | RSA public key PEM (base64) | Fixa no `.env.example` |
| `INTERNAL_SECRET` | Segredo compartilhado com api-gateway | Valor fixo de dev no `.env.example` |
| `TOTP_ISSUER` | Nome exibido no Google Authenticator | `AcabouoMony` |
| `TOTP_AES_KEY` | Chave AES-256 para criptografar TOTP secret | Fixa no `.env.example` |

---

## Estratégia de Testes

| Tipo | Framework | Cenários prioritários |
|------|-----------|----------------------|
| Unitário | JUnit 5 + Mockito | AuthService: registro CUSTOMER vs MERCHANT_OWNER, login, bloqueio, rotação de refresh token |
| Integração | Testcontainers (PostgreSQL + Redis + Kafka) | Fluxo completo registro → confirmação → login → refresh (com rotação) → logout |
| Segurança | Spring Security Test | X-Internal-Secret ausente/inválido, JWT expirado/inválido, STAFF tentando acessar checkout |
| API | MockMvc | Validação condicional de CNPJ, todos os endpoints 2FA, PATCH /me |

---

## Backlog Sprint 2

- [ ] `POST /auth/resend-confirmation` — reenvio de email de confirmação expirado
- [ ] `POST /api/v1/merchants/staff/invite` — convite de STAFF pelo OWNER
- [ ] Alterar email via PATCH /me (com reconfirmação)
- [ ] Alterar senha via PATCH /me (com senha atual)
- [ ] KYC — validação de CNPJ na Receita Federal

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Vazamento de chave JWT privada | Baixa | Crítico | Chave em env var, nunca commitada |
| Timing attack no login | Média | Médio | BCrypt comparison é constant-time |
| Redis indisponível | Baixa | Alto | Refresh tokens no Redis; sem Redis = relogin |
| Dependência circular V1/V2 Flyway | Média | Alto | Resolver no V2 com ALTER TABLE após criar merchants |
| X-Internal-Secret comprometido | Baixa | Alto | Rotacionar via env var sem necessidade de redeploy do código |
