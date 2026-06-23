# Context — Acabou o Mony Frontend

## 1. Persona Principal: Ana

Ana é empreendedora e vende roupas online. Ela usa o Acabou o Mony para receber pagamentos de clientes.

**Dores:** Sistemas de pagamento lentos, falhas durante picos de venda, falta de visibilidade sobre pedidos e transações.

**O que ela precisa do frontend:**
- Ver rapidamente se um pagamento foi aprovado ou recusado
- Listar e filtrar pedidos e transações da loja
- Emitir reembolsos quando necessário
- Acessar o dashboard com métricas da loja

**O que ela não tolera:**
- Tela em branco sem feedback
- Mensagens de erro genéricas sem orientação
- Fluxo de pagamento que redireciona para outra aba

---

## 2. Roles do Sistema

| Role | Pode fazer |
|---|---|
| `CUSTOMER` | Criar pedidos, ver próprios pedidos, pagar, ver próprias transações |
| `MERCHANT_OWNER` | Ver pedidos e transações da loja, emitir reembolsos, ver dashboard de métricas |
| `STAFF` | Apenas leitura (sem refund, sem criar pedidos) |

---

## 3. API — Ponto de Entrada

**Base URL:** `http://localhost:8080` (dev) / variável de ambiente `VITE_API_BASE_URL`

### Rotas públicas (sem JWT)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/confirm-email
POST /api/v1/auth/refresh          ← requer cookie refreshToken (HttpOnly)
POST /api/v1/auth/resend-confirmation
POST /api/v1/auth/2fa/verify
POST /api/v1/auth/2fa/recovery
```

### Rotas protegidas (requerem `Authorization: Bearer <accessToken>`)
```
POST   /api/v1/auth/logout
GET    /api/v1/users/me
PATCH  /api/v1/users/me
POST   /api/v1/auth/2fa/setup
POST   /api/v1/auth/2fa/confirm
POST   /api/v1/auth/2fa/disable

POST   /api/v1/orders               ← requer Idempotency-Key
GET    /api/v1/orders
GET    /api/v1/orders/{orderId}
DELETE /api/v1/orders/{orderId}

POST   /api/v1/transactions         ← requer Idempotency-Key
GET    /api/v1/transactions
GET    /api/v1/transactions/{transactionId}
POST   /api/v1/transactions/{transactionId}/refund   ← requer Idempotency-Key
```

### Rotas INACESSÍVEIS pelo frontend
```
/internal/**  ← retornam 404
```

---

## 4. Enums do Backend

```typescript
type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

type TransactionStatus = 'APPROVED' | 'DECLINED' | 'SUSPECTED_FRAUD' | 'FULLY_REFUNDED' | 'PARTIALLY_REFUNDED' | 'PROCESSING' | 'CANCELLED'

type RefundReason = 'CUSTOMER_REQUEST' | 'DUPLICATE' | 'FRAUD' | 'PRODUCT_NOT_DELIVERED'

type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

type UserRole = 'CUSTOMER' | 'MERCHANT_OWNER' | 'STAFF'
```

---

## 5. Formato de Resposta Padrão

```json
{
  "data": {},
  "meta": { "timestamp": "ISO-8601", "requestId": "uuid?" },
  "errors": []
}
```

**Erro (4xx/5xx):**
```json
{
  "data": null,
  "meta": {},
  "errors": [{ "errorCode": "CARD_DECLINED", "message": "...", "retryable": false }]
}
```

---

## 6. Rate Limits

| Endpoint | Limite |
|---|---|
| `/auth/**` | 10 req/min por IP |
| `/users/**` | 60 req/min por usuário |
| `/transactions/**` | 50 req/min por usuário |
| `/orders/**` | 60 req/min por usuário |

---

## 7. Headers Obrigatórios

```
Authorization: Bearer <accessToken>        ← rotas protegidas
Content-Type: application/json             ← sempre
Idempotency-Key: <uuid-v4>                 ← POST /orders, POST /transactions, POST .../refund
```

---

## 8. Fluxo de Autenticação

1. Login → `accessToken` (JWT, 15min em memória) + cookie `refreshToken` (HttpOnly, 7 dias)
2. Se 2FA ativo → backend retorna `twoFactorToken` (5min) → chamar `/2fa/verify`
3. Refresh automático: POST `/auth/refresh` com cookie (sem corpo) — silencioso
4. Logout: POST `/auth/logout` → limpa AuthContext → backend invalida via Redis blacklist → redirect `/login`

---

## 9. O que o Frontend NÃO pode fazer

- Alterar senha (endpoint inexistente)
- Registrar usuários STAFF (por invite — não implementado)
- Acessar dados de outros usuários além de `/me`
- Cancelar pedidos com status diferente de `PENDING`
- Ver score de fraude diretamente
- Chamar rotas `/internal/**`

---

## 10. Comandos do Projeto

```bash
npm install          # instalar dependências
npm run dev          # dev server (Vite, porta 5173)
npm run build        # build de produção
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Vitest
```
