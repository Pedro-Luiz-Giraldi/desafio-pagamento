# Spec: User Service

**ID:** SPEC-USR-001
**Serviço:** user-service
**Status:** Atualizado — Sessão Grill 2026-05-29
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## Changelog

| Data | Decisão |
|------|---------|
| 2026-05-29 | Modelo de roles revisado: CUSTOMER / MERCHANT_OWNER / STAFF |
| 2026-05-29 | MERCHANT é entidade separada com múltiplos usuários |
| 2026-05-29 | RegisterRequest com campos condicionais para MERCHANT_OWNER |
| 2026-05-29 | `/internal/auth/validate-token` protegido por X-Internal-Secret header |
| 2026-05-29 | Refresh token com rotação obrigatória |
| 2026-05-29 | Chave RSA fixa no .env.example para dev |
| 2026-05-29 | `resend-confirmation` e convite de STAFF deferidos para Sprint 2 |
| 2026-05-29 | `PATCH /me` — só fullName no Sprint 1 |
| 2026-05-29 | CNPJ — só validação de formato |

---

## 1. Visão Geral

O user-service gerencia o ciclo de vida dos usuários: cadastro, autenticação com JWT RS256, proteção por 2FA e gestão de refresh tokens. É o desbloqueador do time — todos os serviços dependem do JWT gerado aqui.

### Modelo de Roles

| Role | Pode comprar | Tem merchant | Como é criado |
|------|-------------|--------------|---------------|
| `CUSTOMER` | Sim | Não | Registro direto |
| `MERCHANT_OWNER` | Sim | Sim (cria merchant no registro) | Registro direto |
| `STAFF` | **Não** | Sim (associado via convite) | Convite pelo OWNER *(Sprint 2)* |

**Regras:**
- `MERCHANT_OWNER` tem capacidade implícita de compra (comportamento no código, não no banco)
- `STAFF` acessa apenas o dashboard operacional do merchant — sem acesso a checkout
- Coluna `role` é um enum único — sem tabela de junção
- `STAFF` via convite: deferido para Sprint 2 (schema preparado com `merchant_id` nullable FK)

---

## 2. Endpoints

```
POST   /api/v1/auth/register              → cadastrar usuário (público)
POST   /api/v1/auth/confirm-email         → confirmar email (público)
POST   /api/v1/auth/login                 → autenticar (público)
POST   /api/v1/auth/refresh               → renovar access token (público)
POST   /api/v1/auth/logout                → invalidar tokens
POST   /api/v1/auth/2fa/setup             → iniciar configuração 2FA
POST   /api/v1/auth/2fa/confirm           → ativar 2FA
POST   /api/v1/auth/2fa/verify            → verificar code no login
POST   /api/v1/auth/2fa/disable           → desativar 2FA
POST   /api/v1/auth/2fa/recovery          → usar recovery code
GET    /api/v1/users/me                   → perfil do usuário autenticado
PATCH  /api/v1/users/me                   → atualizar fullName (Sprint 1 only)

[Interno — requer X-Internal-Secret header]
POST   /internal/auth/validate-token      → validar JWT (chamado pelo api-gateway)

[Sprint 2 — deferido]
POST   /api/v1/auth/resend-confirmation   → reenviar email de confirmação expirado
POST   /api/v1/merchants/staff/invite     → convidar STAFF (OWNER only)
```

---

## 3. OPERAÇÃO: Registrar Usuário

### 3.1 Input — RegisterRequest

```java
public record RegisterRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 100) String password,  // 1 maiúscula, 1 número, 1 especial
    @NotBlank @Size(min = 2, max = 100) String fullName,
    @NotNull UserRole role  // CUSTOMER ou MERCHANT_OWNER (STAFF via convite — Sprint 2)
    // Campos abaixo: obrigatórios somente quando role = MERCHANT_OWNER
    @Size(max = 100) String companyName,
    @Size(min = 14, max = 14) String cnpj  // 14 dígitos, validação de formato + dígitos verificadores
) {}
```

**Validação condicional:**
- Se `role = MERCHANT_OWNER`: `companyName` e `cnpj` são obrigatórios
- Se `role = CUSTOMER`: `companyName` e `cnpj` são ignorados
- `role = STAFF` não é aceito neste endpoint — retorna `INVALID_ROLE`

**Validação de CNPJ:** somente formato (14 dígitos + dígitos verificadores algoritmo Módulo 11). Sem consulta à Receita Federal.

### 3.2 Output — Sucesso (HTTP 201)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| userId | UUID | ID do usuário gerado |
| email | String | Email cadastrado |
| role | String | Role atribuída |
| merchantId | UUID \| null | ID do merchant criado (somente MERCHANT_OWNER) |
| emailConfirmed | Boolean | false — aguardando confirmação |

### 3.3 Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| EMAIL_ALREADY_EXISTS | 409 | false | E-mail já cadastrado |
| WEAK_PASSWORD | 400 | false | Senha não atende critérios mínimos |
| INVALID_EMAIL_FORMAT | 400 | false | Formato de e-mail inválido |
| INVALID_ROLE | 400 | false | Role não permitida (ex: STAFF neste endpoint) |
| INVALID_CNPJ | 400 | false | CNPJ inválido (formato ou dígitos verificadores) |
| MISSING_MERCHANT_DATA | 400 | false | companyName ou cnpj ausentes para MERCHANT_OWNER |
| CNPJ_ALREADY_REGISTERED | 409 | false | CNPJ já cadastrado |

### 3.4 Pós-condições — Sucesso

**Para CUSTOMER:**
- Usuário gravado no PostgreSQL com `status = PENDING_EMAIL_CONFIRMATION`, `role = CUSTOMER`, `merchant_id = null`
- Token de confirmação gerado (UUID) no Redis com TTL 24h
- Evento `user.registered` publicado no Kafka

**Para MERCHANT_OWNER:**
- Usuário gravado com `status = PENDING_EMAIL_CONFIRMATION`, `role = MERCHANT_OWNER`
- Merchant gravado na tabela `merchants` com `owner_id = userId` — **mesma transação atômica**
- `merchant_id` FK preenchido no registro do usuário
- Evento `user.registered` publicado no Kafka (inclui `merchantId` no payload)

**Ambos:**
- Senha armazenada com BCrypt (rounds = 12) — NUNCA em texto puro
- notification-service consome `user.registered` e envia email de boas-vindas + link de confirmação

### 3.5 Invariantes

1. `companyName` e `cnpj` nunca aparecem em logs
2. Se a criação do merchant falhar, o usuário NÃO é criado (transação atômica)
3. `password` nunca é logado ou retornado

### 3.6 Casos Extremos

| ID | Input | Comportamento | Output |
|----|-------|--------------|--------|
| CE-001 | Email duplicado | Rejeitar com mensagem genérica (timing attack prevention) | 409 EMAIL_ALREADY_EXISTS |
| CE-002 | Token de confirmação expirado | *(Sprint 2)* reenviar via resend-confirmation | — |
| CE-003 | role=MERCHANT_OWNER sem cnpj | Rejeitar imediatamente | 400 MISSING_MERCHANT_DATA |
| CE-004 | CNPJ com formato inválido | Rejeitar com erro específico | 400 INVALID_CNPJ |
| CE-005 | CNPJ já cadastrado | Rejeitar | 409 CNPJ_ALREADY_REGISTERED |

---

## 4. OPERAÇÃO: Autenticar Usuário

### 4.1 Input — LoginRequest

```java
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password,
    String totpCode,           // 6 dígitos; obrigatório se 2FA ativo
    String deviceFingerprint   // hash do dispositivo para análise de anomalia
) {}
```

### 4.2 Output — AuthResult (sealed interface)

```java
public sealed interface AuthResult
    permits AuthResult.Success, AuthResult.RequiresTwoFactor, AuthResult.Failure {

    record Success(
        String accessToken,
        String tokenType,      // "Bearer"
        int expiresIn,         // 900 segundos
        boolean requiresTwoFactor  // false
    ) implements AuthResult {}

    record RequiresTwoFactor(
        boolean requiresTwoFactor,  // true
        String twoFactorToken       // token temporário 5 min para completar 2FA
    ) implements AuthResult {}

    record Failure(
        String errorCode,
        String message,
        boolean retryable
    ) implements AuthResult {}
}
```

> `refreshToken` retornado em `Set-Cookie: httpOnly; Secure; SameSite=Strict` — **nunca no body.**

### 4.3 Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| INVALID_CREDENTIALS | 401 | false | E-mail ou senha incorretos (mensagem genérica) |
| ACCOUNT_LOCKED | 423 | false | Conta bloqueada — resposta inclui `unlockAt` (ISO 8601) |
| ACCOUNT_NOT_CONFIRMED | 403 | false | Email não confirmado — não revelar se senha estava certa |
| INVALID_TOTP_CODE | 401 | false | Código 2FA inválido ou expirado |
| ACCOUNT_DISABLED | 403 | false | Conta desativada por admin |
| TOO_MANY_REQUESTS | 429 | true | Rate limit excedido |

### 4.4 Pré-condições

- `email` tem formato válido
- `password` tem no mínimo 8 caracteres
- Conta não está bloqueada
- Taxa de tentativas não excedida (máx 5 falhas → bloqueia 30 min)

### 4.5 Pós-condições — Sucesso

- `accessToken` JWT RS256 gerado com claims:
  ```json
  {
    "sub": "userId",
    "email": "ana@loja.com.br",
    "role": "MERCHANT_OWNER",
    "merchantId": "uuid-ou-null",
    "iat": 1748350860,
    "exp": 1748351760
  }
  ```
- `refreshToken` (UUID opaque, não JWT) armazenado no Redis: `refresh_token:{userId}:{tokenId}` com TTL 7 dias
- `refreshToken` enviado em cookie `httpOnly; Secure; SameSite=Strict`
- Contador de tentativas falhas zerado no Redis
- Evento `user.login.success` publicado no Kafka

### 4.6 Pós-condições — Falha

- Contador de tentativas falhas incrementado (TTL 30 min): `login_attempts:{email}`
- Se tentativas ≥ 5: `account_locked:{email}` criado no Redis (TTL 30 min) + evento `user.login.blocked` no Kafka
- notification-service → email de alerta de segurança ao usuário

### 4.7 Invariantes

1. `password` nunca aparece em nenhum log ou response
2. Mensagem de erro é sempre genérica — não revela qual campo falhou
3. Tempo de resposta com senha errada ≈ senha certa (BCrypt comparison é constant-time)
4. `refreshToken` apenas em httpOnly cookie, nunca no body
5. Após 5 tentativas falhas, conta bloqueada por 30 min

### 4.8 Casos Extremos

| ID | Input | Comportamento | Output |
|----|-------|--------------|--------|
| CE-001 | 2FA ativo, code não enviado | Validar senha → retornar requiresTwoFactor: true | AuthResult.RequiresTwoFactor |
| CE-002 | 5ª tentativa falha | INVALID_CREDENTIALS + bloquear + Kafka event | 401 + lock |
| CE-003 | Login com conta bloqueada | ACCOUNT_LOCKED com unlockAt | 423 + unlockAt |
| CE-004 | Email não confirmado | ACCOUNT_NOT_CONFIRMED — sem revelar se senha certa | 403 |

---

## 5. OPERAÇÃO: Refresh Token

### 5.1 Fluxo

```
POST /api/v1/auth/refresh
Cookie: refreshToken=<uuid>
```

### 5.2 Comportamento — Rotação Obrigatória

1. Ler `refreshToken` do cookie httpOnly
2. Buscar no Redis: `refresh_token:{userId}:{tokenId}`
3. Se não encontrado ou expirado → `REFRESH_TOKEN_INVALID` (401)
4. **Deletar o token antigo do Redis imediatamente** (rotação)
5. Gerar novo `accessToken` JWT
6. Gerar novo `refreshToken` UUID → gravar no Redis (TTL 7 dias)
7. Retornar novo `accessToken` no body + novo `refreshToken` em cookie httpOnly

**Invariante de segurança:** se um token roubado for usado após o usuário legítimo já ter renovado, o token roubado está invalidado pelo passo 4.

### 5.3 Códigos de Erro

| Código | HTTP | Retryable |
|--------|------|-----------|
| REFRESH_TOKEN_INVALID | 401 | false |
| REFRESH_TOKEN_EXPIRED | 401 | false |

---

## 6. OPERAÇÃO: Autenticação de Dois Fatores (2FA)

### 6.1 Endpoints

| Endpoint | Função |
|----------|--------|
| `POST /auth/2fa/setup` | Gerar secret TOTP + QR code + 8 recovery codes |
| `POST /auth/2fa/confirm` | Confirmar e ativar com primeiro code gerado |
| `POST /auth/2fa/verify` | Verificar code durante login (usa twoFactorToken) |
| `POST /auth/2fa/disable` | Desativar (requer senha + code atual) |
| `POST /auth/2fa/recovery` | Usar recovery code para login de emergência |

### 6.2 Output do Setup

| Campo | Tipo | Descrição |
|-------|------|-----------|
| secret | String | Base32 secret — exibido **apenas uma vez** |
| qrCodeUrl | String | `data:image/png;base64,...` para QR code |
| otpAuthUrl | String | `otpauth://` URI para apps (Google Authenticator, Authy) |
| recoveryCodes | List\<String\> | 8 códigos únicos — exibidos **apenas uma vez** |

### 6.3 Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| INVALID_TOTP_CODE | 401 | Código inválido ou fora da janela de tempo (±30s) |
| TWO_FACTOR_ALREADY_ENABLED | 409 | 2FA já está ativo |
| TWO_FACTOR_NOT_ENABLED | 422 | 2FA não está ativo para desativar |
| RECOVERY_CODE_INVALID | 401 | Recovery code inválido ou já usado |
| RECOVERY_CODE_EXHAUSTED | 422 | Todos os 8 recovery codes foram usados |

### 6.4 Invariantes

1. Secret TOTP nunca exibido após o setup inicial
2. Recovery codes exibidos apenas uma vez
3. Cada recovery code pode ser usado apenas uma vez
4. Quando todos os 8 recovery codes são usados → forçar novo setup de 2FA
5. Tolerância de tempo: ±1 janela de 30s

### 6.5 Pós-condições — Ativar 2FA (confirm)

- `twoFactorEnabled = true` na conta
- Secret TOTP gravado criptografado com **AES-256-GCM** (inclui MAC — mais seguro que CBC)
- 8 recovery codes hasheados com BCrypt e gravados na tabela `recovery_codes`
- Evento `user.2fa.enabled` publicado no Kafka

---

## 7. OPERAÇÃO: Validação de Token (Interno)

### 7.1 Uso

Chamado pelo api-gateway para validar JWT antes de rotear para outros serviços. **Chamada crítica** — está no caminho de toda requisição autenticada.

### 7.2 Segurança — X-Internal-Secret

```
POST /internal/auth/validate-token
Authorization: Bearer {jwt}
X-Internal-Secret: {valor da env var INTERNAL_SECRET}
```

- Requisições sem `X-Internal-Secret` ou com valor inválido retornam **HTTP 403** imediatamente, sem processar o token
- O valor do secret é configurado via variável de ambiente `INTERNAL_SECRET` — nunca hardcoded
- api-gateway e user-service devem compartilhar o mesmo valor de `INTERNAL_SECRET`

### 7.3 Output

**Sucesso (HTTP 200):**
```json
{
  "userId": "uuid",
  "email": "ana@loja.com.br",
  "role": "MERCHANT_OWNER",
  "merchantId": "uuid-ou-null"
}
```

**Falha (HTTP 401):** token inválido ou expirado
**Não autorizado (HTTP 403):** X-Internal-Secret ausente ou inválido

### 7.4 Performance e Cache

- P99 < 50ms (caminho crítico de toda requisição)
- Resultado cacheado pelo api-gateway por até 30s: `token_validation:{hash(token)}` no Redis
- O user-service NÃO faz cache próprio deste endpoint — o cache fica no api-gateway

---

## 8. OPERAÇÃO: Atualizar Perfil

### 8.1 Sprint 1 — Somente fullName

```
PATCH /api/v1/users/me
Authorization: Bearer {jwt}
```

```java
public record UpdateProfileRequest(
    @NotBlank @Size(min = 2, max = 100) String fullName
) {}
```

### 8.2 Backlog Sprint 2+

- Alterar email (requer reconfirmação via link)
- Alterar senha (requer senha atual)
- Atualizar dados do merchant (MERCHANT_OWNER only)

---

## 9. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| Register (CUSTOMER) | 80ms | 200ms |
| Register (MERCHANT_OWNER) | 100ms | 250ms |
| Login (BCrypt) | 150ms | 300ms |
| 2FA verify | 30ms | 100ms |
| Token validate (interno) | 10ms | 50ms |
| Refresh token | 20ms | 80ms |

---

## 10. Segurança

- Senhas armazenadas com **BCrypt (rounds = 12)**
- JWT assinado com **RS256** (chave assimétrica RSA 2048 bits)
  - Dev: chave fixa definida no `.env.example`
  - Prod: chave obrigatória via variável de ambiente `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`
- `refreshToken` em **httpOnly + Secure + SameSite=Strict** cookie — nunca no body
- Refresh token com **rotação obrigatória** a cada renovação
- Rate limiting: 5 tentativas por email em 30 min (Redis)
- TOTP usa HMAC-SHA1, período 30s, 6 dígitos (RFC 6238), tolerância ±1 janela
- Recovery codes armazenados como hashes BCrypt
- Secret TOTP criptografado com **AES-256-GCM** no banco
- Endpoint `/internal/auth/validate-token` protegido por **X-Internal-Secret** header
- `cnpj`, `password`, `totpCode` nunca aparecem em logs
- Headers obrigatórios em todas as respostas: `X-Content-Type-Options`, `Strict-Transport-Security`
