# Contratos de API — Acabou o Mony

**Versão:** 2.0
**Base URL:** `https://api.acaboumony.com`
**Protocolo:** HTTPS / TLS 1.3
**Formato:** JSON
**Autenticação:** Bearer JWT (exceto rotas públicas marcadas com 🔓)

---

## Padrão de Response

Toda resposta segue o envelope:

```json
{
  "data": { },
  "meta": {
    "timestamp": "2026-05-27T14:00:00Z",
    "requestId": "req_abc123"
  },
  "errors": []
}
```

**Sucesso:** `data` preenchido, `errors` vazio.
**Falha:** `data` nulo ou parcial, `errors` com lista de erros.

### Objeto de erro (RFC 7807)

```json
{
  "code": "CARD_DECLINED",
  "message": "Seu cartão foi recusado.",
  "field": "cardToken",
  "retryable": true
}
```

---

## Paginação

```
Query params: ?page=0&size=20&sort=createdAt,desc
```

```json
{
  "data": [ ... ],
  "meta": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

---

## Códigos HTTP utilizados

| Código | Uso |
|--------|-----|
| 200 | Sucesso em GET/PUT |
| 201 | Recurso criado (POST) |
| 204 | Sucesso sem body (DELETE) |
| 400 | Request inválido (validação) |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email já cadastrado, idempotencyKey duplicada) |
| 422 | Regra de negócio violada (ex: cartão recusado) |
| 423 | Conta bloqueada |
| 429 | Rate limit excedido |
| 500 | Erro interno |
| 503 | Serviço temporariamente indisponível (circuit breaker) |

---

# MÓDULO: AUTH / USER SERVICE (Dev 2)

---

## 🔓 POST /api/v1/auth/register

Cadastro de novo usuário.

**Request:**
```json
{
  "email": "ana@loja.com.br",
  "password": "senhaSegura123!",
  "fullName": "Ana Silva",
  "role": "MERCHANT"
}
```

**Response 201:**
```json
{
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "ana@loja.com.br",
    "role": "MERCHANT",
    "emailConfirmed": false
  }
}
```

**Erros:** `EMAIL_ALREADY_EXISTS` (409), `WEAK_PASSWORD` (400)

---

## 🔓 POST /api/v1/auth/confirm-email

Confirmar email após cadastro.

**Request:**
```json
{ "token": "uuid-token-recebido-por-email" }
```

**Response 200:**
```json
{ "data": { "emailConfirmed": true } }
```

---

## 🔓 POST /api/v1/auth/login

**Request:**
```json
{
  "email": "ana@loja.com.br",
  "password": "senhaSegura123!",
  "totpCode": "123456"
}
```

**Response 200 — login completo:**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "requiresTwoFactor": false
  }
}
```

**Response 200 — 2FA pendente:**
```json
{
  "data": {
    "requiresTwoFactor": true,
    "twoFactorToken": "tmp_abc123"
  }
}
```

**Erros:** `INVALID_CREDENTIALS` (401), `ACCOUNT_LOCKED` (423), `ACCOUNT_NOT_CONFIRMED` (403), `TOO_MANY_REQUESTS` (429)

> `refreshToken` retornado em `Set-Cookie` httpOnly, **nunca** no body.

---

## 🔓 POST /api/v1/auth/refresh

**Request:** sem body (refresh token via cookie httpOnly)

**Response 200:**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

---

## POST /api/v1/auth/logout

**Response 204** sem body.

---

## POST /api/v1/auth/2fa/setup

**Response 200:**
```json
{
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,...",
    "otpAuthUrl": "otpauth://totp/AcabouoMony:ana@...",
    "recoveryCodes": ["XXXX-1", "XXXX-2", "...", "XXXX-8"]
  }
}
```

---

## POST /api/v1/auth/2fa/confirm

**Request:** `{ "totpCode": "123456" }`
**Response 200:** `{ "data": { "twoFactorEnabled": true } }`

---

## 🔓 POST /api/v1/auth/2fa/verify

**Request:**
```json
{
  "twoFactorToken": "tmp_abc123",
  "totpCode": "123456"
}
```
**Response 200:** mesmo formato do login completo.

---

## GET /api/v1/users/me

**Response 200:**
```json
{
  "data": {
    "userId": "uuid",
    "email": "ana@loja.com.br",
    "fullName": "Ana Silva",
    "role": "MERCHANT",
    "twoFactorEnabled": true,
    "emailConfirmed": true,
    "createdAt": "2026-05-27T14:00:00Z"
  }
}
```

---

# MÓDULO: TRANSACTIONS / PAYMENT SERVICE (Dev 1)

---

## POST /api/v1/transactions

Processar pagamento.

**Headers obrigatórios:**
```
Authorization: Bearer {accessToken}
Idempotency-Key: {uuid}
```

**Request:**
```json
{
  "amountInCents": 8990,
  "currency": "BRL",
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "orderId": "660f9511-f30c-52e5-b827-557766551111",
  "cardToken": "ae4e50b2a8f3d5e9k8h1j7l4m6n2p0q1",
  "paymentMethodId": "visa",
  "installments": 1
}
```

**Response 201 — Sucesso:**
```json
{
  "data": {
    "transactionId": "txn_xyz789",
    "mpPaymentId": 1234567890,
    "orderId": "660f9511-f30c-52e5-b827-557766551111",
    "status": "APPROVED",
    "processingTimeMs": 547
  }
}
```

**Response 422 — Falha de negócio:**
```json
{
  "data": { "status": "FAILURE", "processingTimeMs": 245 },
  "errors": [{
    "code": "CARD_DECLINED",
    "message": "Seu cartão foi recusado. Verifique o limite ou tente outro cartão.",
    "retryable": true
  }]
}
```

**Erros:** `INVALID_AMOUNT`, `CARD_DECLINED`, `INSUFFICIENT_FUNDS`, `SUSPECTED_FRAUD`, `ORDER_NOT_PENDING`, `RATE_LIMIT_EXCEEDED`, `MP_GATEWAY_TIMEOUT`

**SLA:** P99 < 1.000ms

---

## GET /api/v1/transactions/{transactionId}

**Response 200:**
```json
{
  "data": {
    "transactionId": "txn_xyz789",
    "mpPaymentId": 1234567890,
    "status": "APPROVED",
    "amountInCents": 8990,
    "currency": "BRL",
    "cardBrand": "visa",
    "cardLastFour": "4242",
    "orderId": "660f9511-f30c-52e5-b827-557766551111",
    "createdAt": "2026-05-27T14:00:00Z",
    "updatedAt": "2026-05-27T14:00:01Z",
    "processingTimeMs": 547,
    "refunds": []
  }
}
```

**Erros:** `TRANSACTION_NOT_FOUND` (404), `FORBIDDEN` (403)

---

## GET /api/v1/transactions

**Query params:** `?page=0&size=20&sort=createdAt,desc&status=APPROVED`
**Response 200:** lista paginada de `TransactionSummary`

---

## POST /api/v1/transactions/{transactionId}/refund

**Headers:** `Idempotency-Key: {uuid}`

**Request:**
```json
{
  "amountInCents": 8990,
  "reason": "CUSTOMER_REQUEST",
  "requestedBy": "merchant-uuid-001"
}
```

**Response 201:**
```json
{
  "data": {
    "refundId": "ref_abc123",
    "transactionId": "txn_xyz789",
    "amountInCents": 8990,
    "status": "SUCCESS",
    "estimatedArrivalDays": 5
  }
}
```

**Erros:** `TRANSACTION_NOT_FOUND`, `ALREADY_FULLY_REFUNDED`, `AMOUNT_EXCEEDS_ORIGINAL`, `REFUND_WINDOW_EXPIRED`, `INSUFFICIENT_PERMISSIONS`

---

# MÓDULO: ORDERS / ORDER SERVICE (Dev 3)

---

## POST /api/v1/orders

Criar pedido (deve existir antes do pagamento).

**Headers:** `Idempotency-Key: {uuid}`

**Request:**
```json
{
  "merchantId": "merchant-uuid-001",
  "items": [
    {
      "productId": "prod_vestido_azul",
      "description": "Vestido Azul Floral Tam M",
      "quantity": 1,
      "unitPriceInCents": 8990
    }
  ]
}
```

**Response 201:**
```json
{
  "data": {
    "orderId": "660f9511-f30c-52e5-b827-557766551111",
    "status": "PENDING",
    "totalInCents": 8990,
    "items": [...],
    "expiresAt": "2026-05-27T14:15:00Z",
    "createdAt": "2026-05-27T14:00:00Z"
  }
}
```

**Erros:** `DUPLICATE_ORDER` (409), `EMPTY_ORDER` (400), `INVALID_ITEM_PRICE` (400), `TOTAL_EXCEEDS_LIMIT` (400)

---

## GET /api/v1/orders/{orderId}

**Response 200:**
```json
{
  "data": {
    "orderId": "uuid",
    "customerId": "uuid",
    "merchantId": "uuid",
    "status": "PAID",
    "totalInCents": 8990,
    "items": [...],
    "transactionId": "txn_xyz789",
    "createdAt": "2026-05-27T14:00:00Z",
    "updatedAt": "2026-05-27T14:01:00Z"
  }
}
```

**Erros:** `ORDER_NOT_FOUND` (404), `FORBIDDEN` (403)

---

## GET /api/v1/orders

**Query params:** `?status=PENDING&page=0&size=20&sort=createdAt,desc`
**Response 200:** lista paginada de `OrderSummary`

---

## DELETE /api/v1/orders/{orderId}

Cancelar pedido (somente status PENDING).

**Response 204** sem body.

**Erros:** `ORDER_NOT_FOUND` (404), `ORDER_CANNOT_BE_CANCELLED` (422), `INSUFFICIENT_PERMISSIONS` (403)

---

# Interfaces Internas (entre serviços — não expostas externamente)

---

## [Interno] POST /internal/auth/validate-token

Chamado pelo `api-gateway` para validar JWT.

**Header:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "userId": "uuid",
  "email": "ana@loja.com.br",
  "roles": ["MERCHANT"],
  "merchantId": "uuid"
}
```

**Response 401:** token inválido ou expirado

---

## [Interno] POST /internal/fraud/score

Chamado pelo `payment-service` antes de cada transação.

**Request:**
```json
{
  "transactionId": "temp-uuid",
  "customerId": "uuid",
  "amountInCents": 8990,
  "paymentMethodId": "visa",
  "ipAddress": "192.168.1.1",
  "deviceFingerprint": "hash"
}
```

**Response 200:**
```json
{
  "score": 15,
  "decision": "APPROVE",
  "reasons": [],
  "analysisTimeMs": 45
}
```

---

## Webhooks Recebidos

| Origem | URL | Autenticação |
|--------|-----|-------------|
| Mercado Pago | `POST /api/v1/webhooks/mercadopago` | `x-signature` header |

**Regra:** validar assinatura antes de qualquer processamento. Se inválido → HTTP 400, sem log do payload.
