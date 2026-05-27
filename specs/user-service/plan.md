# Plano Técnico: User Service

**Spec:** [spec.md](spec.md)
**Status:** Draft
**Responsável:** Dev 2
**Sprint:** 1

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| JWT signing | RS256 (chave assimétrica) | HS256 | Chave pública pode ser compartilhada com serviços sem expor secret |
| Password hashing | BCrypt rounds=12 | Argon2 | Padrão Spring Security, bcrypt rounds=12 balanceia segurança/latência |
| Refresh token storage | Redis (TTL 7 dias) | DB | Revogação instantânea; DB seria lento |
| 2FA library | dev.samstevens.totp:1.7.x | Google Auth Library | Biblioteca Java bem mantida, RFC 6238 compliant |
| TOTP secret encryption | AES-256-GCM | AES-256-CBC | GCM inclui autenticação (MAC), mais seguro |
| Email confirmation | Token UUID no Redis (TTL 24h) | Token JWT | Mais fácil de invalidar; JWT não pode ser revogado facilmente |

---

## Dependências

### Serviços consumidos
- Nenhum (user-service é desbloqueador do time — sem dependências de outros serviços)

### Tópicos Kafka produzidos
- `user.registered` — ao criar conta
- `user.login.blocked` — ao bloquear conta por tentativas excessivas
- `user.2fa.enabled` — ao ativar 2FA
- `user.login.success` — ao logar com sucesso (analytics de segurança)

### Tabelas do banco (schema: user_service)

| Tabela | Propósito |
|--------|-----------|
| `users` | Dados dos usuários (email, senha hash, role, status) |
| `merchants` | Dados adicionais de merchants (razão social, CNPJ) |
| `recovery_codes` | 8 recovery codes por usuário (hash BCrypt) |
| `audit_logs` | Tentativas de login, ações de segurança |

### Chaves Redis

| Key | TTL | Propósito |
|-----|-----|-----------|
| `refresh_token:{userId}:{tokenId}` | 7 dias | Refresh tokens válidos |
| `login_attempts:{email}` | 30min | Contador de tentativas falhas |
| `account_locked:{email}` | 30min | Flag de bloqueio |
| `email_confirm:{token}` | 24h | Tokens de confirmação de email |
| `2fa_setup:{userId}` | 10min | Secret TOTP temporário durante setup |
| `2fa_login:{twoFactorToken}` | 5min | Token temporário do fluxo 2FA |
| `token_validation:{hash}` | 30s | Cache de validação de JWT (para api-gateway) |

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
│   └── UserService.java
├── repository/
│   ├── UserRepository.java
│   └── RecoveryCodeRepository.java
├── domain/
│   ├── entity/
│   │   ├── User.java
│   │   ├── Merchant.java
│   │   └── RecoveryCode.java
│   └── enums/
│       ├── UserRole.java
│       └── UserStatus.java
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java          (Record)
│   │   ├── LoginRequest.java             (Record)
│   │   ├── TwoFactorConfirmRequest.java  (Record)
│   │   └── TwoFactorVerifyRequest.java   (Record)
│   └── response/
│       ├── AuthResponse.java             (Record)
│       ├── TwoFactorSetupResponse.java   (Record)
│       └── UserProfileResponse.java      (Record)
├── result/
│   └── AuthResult.java                   (sealed interface)
├── exception/
│   ├── InvalidCredentialsException.java
│   ├── AccountLockedException.java
│   └── InvalidTotpCodeException.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   └── RedisConfig.java
├── security/
│   ├── JwtTokenProvider.java
│   └── JwtTokenValidator.java
├── event/
│   └── UserEventProducer.java            (Kafka producer)
└── mapper/
    └── UserMapper.java
```

---

## Flyway Migrations

| Versão | Arquivo | Conteúdo |
|--------|---------|---------|
| V1 | `V1__create_users.sql` | Tabela users, índices em email |
| V2 | `V2__create_merchants.sql` | Tabela merchants, FK para users |
| V3 | `V3__create_recovery_codes.sql` | Tabela recovery_codes, FK para users |
| V4 | `V4__create_audit_logs.sql` | Tabela user_audit_logs |

---

## JWT — Estrutura

```json
{
  "sub": "userId",
  "email": "ana@loja.com.br",
  "roles": ["MERCHANT"],
  "merchantId": "uuid-ou-null",
  "iat": 1748350860,
  "exp": 1748351760
}
```

- Chave RSA 2048 bits gerada no startup (dev) ou via variável de ambiente (prod)
- Access token: 15min
- Refresh token: 7 dias (opaque token UUID, não JWT)

---

## Estratégia de Testes

| Tipo | Framework | Cenários |
|------|-----------|----------|
| Unitário | JUnit 5 + Mockito | AuthService: login, bloqueio, 2FA |
| Integração | Testcontainers (PostgreSQL + Redis + Kafka) | Fluxo completo de registro → login → 2FA |
| Segurança | Spring Security Test | Rotas protegidas, JWT válido/inválido |
| API | MockMvc | Todos os endpoints, validação de input |

---

## Configuração Docker Compose

```yaml
user-service:
  image: acaboumony/user-service:latest
  ports:
    - "8081:8081"
  environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/user_db
    - SPRING_REDIS_HOST=redis
    - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    - JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
    - JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
    - TOTP_ISSUER=AcabouoMony
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    - NEW_RELIC_APP_NAME=acaboumony-user-service
  depends_on:
    - postgres
    - redis
    - kafka
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Vazamento de chave JWT privada | Baixa | Crítico | Chave em env var, nunca no repositório |
| Timing attack no login | Média | Médio | BCrypt comparison é constant-time por design |
| Redis indisponível (refresh tokens) | Baixa | Alto | Refresh tokens no Redis + fallback para relogin |
