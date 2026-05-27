# Spec: User Service

**ID:** SPEC-USR-001
**Serviço:** user-service
**Status:** Draft
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

O user-service gerencia o ciclo de vida dos usuários: cadastro com confirmação de email, autenticação com JWT, proteção por 2FA e gestão de refresh tokens. É o desbloqueador do time — outros serviços dependem do JWT filter que este serviço fornece.

---

## 2. Endpoints

```
POST   /api/v1/auth/register         → cadastrar usuário (público)
POST   /api/v1/auth/confirm-email    → confirmar email (público)
POST   /api/v1/auth/login            → autenticar (público)
POST   /api/v1/auth/refresh          → renovar access token (público)
POST   /api/v1/auth/logout           → invalidar tokens
POST   /api/v1/auth/2fa/setup        → iniciar configuração 2FA
POST   /api/v1/auth/2fa/confirm      → ativar 2FA
POST   /api/v1/auth/2fa/verify       → verificar code no login
POST   /api/v1/auth/2fa/disable      → desativar 2FA
POST   /api/v1/auth/2fa/recovery     → usar recovery code
GET    /api/v1/users/me              → perfil do usuário autenticado
PATCH  /api/v1/users/me              → atualizar perfil

[Interno]
POST   /internal/auth/validate-token → validar JWT (chamado pelo api-gateway)
```

---

## 3. OPERAÇÃO: Registrar Usuário

### 3.1 Input — RegisterRequest

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| email | String | Sim | Formato válido, max 255 chars, único no sistema |
| password | String | Sim | Min 8 chars, 1 maiúscula, 1 número, 1 especial |
| fullName | String | Sim | Min 2 chars, max 100 chars |
| role | String | Sim | "MERCHANT" ou "CUSTOMER" |

### 3.2 Output — Sucesso (HTTP 201)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| userId | UUID | ID gerado |
| email | String | Email cadastrado |
| role | String | Role atribuída |
| emailConfirmed | Boolean | false — aguardando confirmação |

### 3.3 Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| EMAIL_ALREADY_EXISTS | 409 | false | E-mail já cadastrado |
| WEAK_PASSWORD | 400 | false | Senha não atende critérios mínimos |
| INVALID_EMAIL_FORMAT | 400 | false | Formato de e-mail inválido |
| INVALID_ROLE | 400 | false | Role não permitida |

### 3.4 Pós-condições — Sucesso

- Usuário gravado no PostgreSQL com `status = PENDING_EMAIL_CONFIRMATION`
- Token de confirmação gerado (UUID) e armazenado no Redis com TTL 24h
- Evento `user.registered` publicado no Kafka
- notification-service consome o evento e envia email de boas-vindas + link de confirmação
- Senha armazenada com BCrypt (rounds = 12) — NUNCA em texto puro

### 3.5 Casos Extremos

#### CE-001: Email duplicado
- Rejeitar com `EMAIL_ALREADY_EXISTS` — não revelar se o email existe no sistema para usuários não autenticados (timing attack)
- Na prática: retornar HTTP 409 com mensagem genérica

#### CE-002: Token de confirmação expirado (24h)
- Reenviar novo email de confirmação via `POST /auth/resend-confirmation`
- Token antigo invalidado no Redis

---

## 4. OPERAÇÃO: Autenticar Usuário

### 4.1 Input — LoginRequest

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| email | String | Sim | Formato válido |
| password | String | Sim | Min 8 chars, nunca logado |
| totpCode | String | Não | 6 dígitos; obrigatório se 2FA ativo |
| deviceFingerprint | String | Não | Hash do dispositivo para análise de anomalia |

### 4.2 Output — AuthResult (sealed)

**Sucesso sem 2FA ou 2FA já validado:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| accessToken | String | JWT, expira em 15 minutos |
| tokenType | String | "Bearer" |
| expiresIn | Integer | 900 (segundos) |
| requiresTwoFactor | Boolean | false |

> `refreshToken` retornado em `Set-Cookie: httpOnly; Secure; SameSite=Strict`, nunca no body.

**Requer 2FA (2FA ativo, code não enviado):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| requiresTwoFactor | Boolean | true |
| twoFactorToken | String | Token temporário (5 min) para completar o 2FA |

### 4.3 Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| INVALID_CREDENTIALS | 401 | false | E-mail ou senha incorretos (mensagem genérica) |
| ACCOUNT_LOCKED | 423 | false | Conta bloqueada por excesso de tentativas |
| ACCOUNT_NOT_CONFIRMED | 403 | false | Email não confirmado |
| INVALID_TOTP_CODE | 401 | false | Código 2FA inválido ou expirado |
| ACCOUNT_DISABLED | 403 | false | Conta desativada por admin |
| TOO_MANY_REQUESTS | 429 | true | Rate limit excedido |

### 4.4 Pré-condições

- `email` tem formato válido
- `password` tem no mínimo 8 caracteres
- Conta não está bloqueada
- Taxa de tentativas não excedida (máx 5 falhas → bloqueia 30 min)

### 4.5 Pós-condições — Sucesso

- `accessToken` JWT gerado com claims: `sub` (userId), `email`, `roles`, `merchantId`, `iat`, `exp`
- `refreshToken` armazenado no Redis com TTL 7 dias
- Contador de tentativas falhas zerado
- Evento `user.login.success` publicado no Kafka (análise de segurança)

### 4.6 Pós-condições — Falha

- Contador de tentativas falhas incrementado (TTL 30 min)
- Se tentativas ≥ 5: conta bloqueada, evento `user.login.blocked` no Kafka
- notification-service → email de alerta de segurança ao usuário

### 4.7 Invariantes

1. `password` nunca aparece em nenhum log ou response
2. Mensagem de erro é sempre genérica — não revela qual campo falhou
3. Tempo de resposta com senha errada ≈ senha certa (timing attack prevention)
4. `refreshToken` apenas em httpOnly cookie, nunca no body
5. Após 5 tentativas falhas, conta bloqueada por 30 min

### 4.8 Casos Extremos

#### CE-001: 2FA ativo, code não enviado
- Validar senha → retornar `requiresTwoFactor: true` + `twoFactorToken` temporário (5 min)
- Próximo passo: `POST /auth/2fa/verify` com `twoFactorToken` + `totpCode`

#### CE-002: 5ª tentativa falha
- Retornar `INVALID_CREDENTIALS` + bloquear conta + evento Kafka → email de alerta

#### CE-003: Login após bloqueio (antes de 30 min)
- Retornar `ACCOUNT_LOCKED` com `unlockAt` (ISO 8601)

#### CE-004: Conta com email não confirmado
- Retornar `ACCOUNT_NOT_CONFIRMED` — não revelar se a senha estava certa

---

## 5. OPERAÇÃO: Autenticação de Dois Fatores (2FA)

### 5.1 Endpoints e Funções

| Endpoint | Função |
|----------|--------|
| `POST /auth/2fa/setup` | Gerar secret TOTP + QR code + 8 recovery codes |
| `POST /auth/2fa/confirm` | Confirmar e ativar com primeiro code gerado |
| `POST /auth/2fa/verify` | Verificar code durante login |
| `POST /auth/2fa/disable` | Desativar (requer senha + code atual) |
| `POST /auth/2fa/recovery` | Usar recovery code para login de emergência |

### 5.2 Output do Setup

| Campo | Tipo | Descrição |
|-------|------|-----------|
| secret | String | Base32 secret (exibido apenas uma vez) |
| qrCodeUrl | String | data:image/png;base64,... para QR code |
| otpAuthUrl | String | otpauth:// URI para apps (Google Authenticator, Authy) |
| recoveryCodes | List\<String\> | 8 códigos únicos — exibidos apenas uma vez |

### 5.3 Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| INVALID_TOTP_CODE | 401 | Código inválido ou fora da janela de tempo (±30s) |
| TWO_FACTOR_ALREADY_ENABLED | 409 | 2FA já está ativo |
| TWO_FACTOR_NOT_ENABLED | 422 | 2FA não está ativo para desativar |
| RECOVERY_CODE_INVALID | 401 | Recovery code inválido ou já usado |
| RECOVERY_CODE_EXHAUSTED | 422 | Todos os 8 recovery codes foram usados |

### 5.4 Invariantes

1. Secret TOTP nunca exibido após o setup inicial
2. Recovery codes exibidos apenas uma vez — após isso, irrecuperáveis
3. Cada recovery code pode ser usado apenas uma vez
4. Quando todos os 8 recovery codes são usados → forçar novo setup de 2FA
5. Tolerância de tempo para TOTP: ±1 janela de 30s

### 5.5 Pós-condições — Ativar 2FA (confirm)

- `twoFactorEnabled = true` na conta
- Secret TOTP gravado criptografado com AES-256
- 8 recovery codes hasheados com BCrypt e gravados
- Evento `user.2fa.enabled` publicado no Kafka
- notification-service → email de confirmação de ativação

### 5.6 Casos Extremos

#### CE-001: Usuário perde o telefone
- Fluxo: login → 2FA screen → "Usar código de recuperação" → `POST /2fa/recovery`
- Recovery code marcado como usado; email de alerta enviado

#### CE-002: Todos os recovery codes usados
- Conta volta a não ter 2FA; email urgente para reconfigurar

#### CE-003: Brute force no TOTP
- Máx 5 tentativas inválidas em 5 min → bloquear temporariamente

---

## 6. OPERAÇÃO: Validação de Token (Interno)

### 6.1 Uso

Chamado pelo api-gateway para validar JWT antes de rotear requisições para outros serviços.

### 6.2 Input

```
POST /internal/auth/validate-token
Authorization: Bearer {token}
```

### 6.3 Output

**Sucesso (HTTP 200):**
```json
{
  "userId": "uuid",
  "email": "ana@loja.com.br",
  "roles": ["MERCHANT"],
  "merchantId": "uuid-ou-null"
}
```

**Falha (HTTP 401):** token inválido ou expirado

### 6.4 Requisitos

- Resposta em P99 < 50ms (chamada crítica no caminho de todas as requisições)
- Resultado pode ser cacheado pelo api-gateway por até 30s para o mesmo token

---

## 7. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| Register | 80ms | 200ms |
| Login (bcrypt) | 150ms | 300ms |
| 2FA verify | 30ms | 100ms |
| Token validate (interno) | 10ms | 50ms |
| Refresh token | 20ms | 80ms |

---

## 8. Segurança

- Senhas armazenadas com BCrypt (rounds = 12)
- JWT assinado com RS256 (chave assimétrica)
- `refreshToken` em httpOnly + Secure + SameSite=Strict cookie
- Rate limiting: 5 tentativas por email/IP em 30 min
- TOTP usa HMAC-SHA1, período 30s, 6 dígitos (RFC 6238)
- Recovery codes armazenados como hashes BCrypt — nunca em texto puro
- Secret TOTP criptografado com AES-256 no banco
- Headers obrigatórios em todas as respostas: `X-Content-Type-Options`, `Strict-Transport-Security`
- Logs de todas as tentativas de login para auditoria — nunca logar senha
