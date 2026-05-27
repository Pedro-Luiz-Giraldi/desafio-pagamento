# Spec: Order Service

**ID:** SPEC-ORD-001
**Serviço:** order-service
**Status:** Draft
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

O order-service gerencia o ciclo de vida dos pedidos. Um pedido precisa existir antes do pagamento — ele representa a intenção de compra com os itens e valor total. O payment-service referencia o orderId ao processar uma transação, e publica eventos que o order-service consome para atualizar o status do pedido.

---

## 2. Endpoints

```
POST   /api/v1/orders                     → criar pedido
GET    /api/v1/orders/{orderId}           → consultar pedido por ID
GET    /api/v1/orders                     → listar pedidos (paginado)
DELETE /api/v1/orders/{orderId}           → cancelar pedido (somente PENDING)
```

---

## 3. Ciclo de Vida do Pedido

```
PENDING → PROCESSING → PAID
           ↓              ↓
        CANCELLED      REFUNDED (total)
                       PARTIALLY_REFUNDED (parcial)
```

| Status | Descrição | Transição |
|--------|-----------|-----------|
| PENDING | Pedido criado, aguardando pagamento | Criado pelo cliente |
| PROCESSING | Pagamento em andamento | payment-service inicia processamento |
| PAID | Pagamento confirmado | Evento `transaction.completed` recebido |
| CANCELLED | Pedido cancelado antes do pagamento | Cliente cancela ou timeout |
| REFUNDED | Estorno total processado | Evento `transaction.refunded` (total) recebido |
| PARTIALLY_REFUNDED | Estorno parcial | Evento `transaction.refunded` (parcial) recebido |

---

## 4. OPERAÇÃO: Criar Pedido

### 4.1 Assinatura

**Service:** `OrderService.createOrder(CreateOrderRequest request): OrderResult`

### 4.2 Input — CreateOrderRequest

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| customerId | UUID | Sim | UUID válido, extraído do JWT |
| merchantId | UUID | Sim | UUID válido do merchant vendedor |
| items | List\<OrderItem\> | Sim | Min 1 item |
| idempotencyKey | UUID | Sim | Previne criação duplicada |

**OrderItem:**

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| productId | String | Sim | ID do produto no catálogo do merchant |
| description | String | Sim | Descrição do item, max 255 chars |
| quantity | Integer | Sim | Min 1, max 999 |
| unitPriceInCents | Long | Sim | Min 1, max 999999 |

### 4.3 Output — OrderResult (sealed)

**Sucesso (HTTP 201):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| orderId | UUID | ID único do pedido |
| status | String | "PENDING" |
| totalInCents | Long | Soma de (quantity × unitPriceInCents) para todos os items |
| items | List\<OrderItem\> | Items confirmados |
| expiresAt | Instant | Expiração do pedido (15 min se não pago) |
| createdAt | Instant | Data/hora de criação |

### 4.4 Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| DUPLICATE_ORDER | 409 | false | Mesmo idempotencyKey nas últimas 24h |
| EMPTY_ORDER | 400 | false | Lista de items vazia |
| INVALID_ITEM_PRICE | 400 | false | Preço unitário inválido (≤ 0 ou > 999999) |
| INVALID_QUANTITY | 400 | false | Quantidade inválida (≤ 0 ou > 999) |
| MERCHANT_NOT_FOUND | 404 | false | Merchant não existe |
| TOTAL_EXCEEDS_LIMIT | 400 | false | Total do pedido > R$9.999,99 |

### 4.5 Pré-condições

- `customerId` extraído do JWT do usuário autenticado
- `merchantId` existe no sistema
- Pelo menos 1 item no pedido
- Total calculado ≤ 999999 centavos
- `idempotencyKey` não usado nas últimas 24h

### 4.6 Pós-condições — Sucesso

- Pedido gravado no PostgreSQL com `status = PENDING`
- `idempotencyKey` registrado no Redis com TTL 24h
- Job agendado para cancelar pedido após 15 min sem pagamento (via Kafka delay ou scheduled task)
- Evento `order.created` publicado no Kafka

### 4.7 Invariantes

1. `totalInCents` é sempre igual à soma calculada dos items — nunca aceitar total pré-calculado do cliente
2. Um pedido PENDING pode receber apenas um pagamento
3. Um pedido PAID nunca volta para PENDING
4. Items de um pedido são imutáveis após criação

### 4.8 Casos Extremos

#### CE-001: Pedido duplicado (mesma idempotencyKey)
- Retornar pedido original já criado (HTTP 200, não 201)
- Comportamento idêntico ao processamento original

#### CE-002: Pedido expira sem pagamento (15 min)
- Status → CANCELLED automaticamente
- Evento `order.cancelled` publicado no Kafka

#### CE-003: Merchant inativo ou suspenso
- Rejeitar criação do pedido com `MERCHANT_NOT_FOUND` (HTTP 404)
- Não revelar que o merchant existe mas está suspenso

#### CE-004: Item com preço zero
- Rejeitar com `INVALID_ITEM_PRICE`

---

## 5. OPERAÇÃO: Consultar Pedido

### 5.1 Output — OrderDetail

| Campo | Tipo | Descrição |
|-------|------|-----------|
| orderId | UUID | ID do pedido |
| customerId | UUID | ID do cliente |
| merchantId | UUID | ID do merchant |
| status | String | Status atual |
| totalInCents | Long | Valor total |
| items | List\<OrderItemDetail\> | Items com descrição |
| transactionId | String | ID da transação associada (null se ainda não pago) |
| createdAt | Instant | Data de criação |
| updatedAt | Instant | Última atualização |
| expiresAt | Instant | Expiração (null se não está PENDING) |

### 5.2 Autorização

- CUSTOMER: pode ver apenas seus próprios pedidos
- MERCHANT: pode ver todos os pedidos do seu merchantId
- ADMIN: pode ver qualquer pedido
- Acesso negado → HTTP 403 (nunca 404 para não revelar existência)

### 5.3 Paginação

- `GET /api/v1/orders?customerId={id}&status={status}&page=0&size=20&sort=createdAt,desc`
- Máx 100 itens por página

---

## 6. OPERAÇÃO: Cancelar Pedido

### 6.1 Regras

- Somente pedidos com `status = PENDING` podem ser cancelados
- Apenas o customer dono ou um admin pode cancelar
- Cancelamento de pedido PROCESSING ou PAID → rejeitar com `ORDER_CANNOT_BE_CANCELLED`

### 6.2 Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| ORDER_NOT_FOUND | 404 | Pedido não existe |
| ORDER_CANNOT_BE_CANCELLED | 422 | Status não permite cancelamento |
| INSUFFICIENT_PERMISSIONS | 403 | Sem permissão para cancelar |

---

## 7. Consumo de Eventos Kafka

| Evento | Ação |
|--------|------|
| `transaction.completed` | Atualizar pedido para PAID, gravar transactionId |
| `transaction.refunded` (total) | Atualizar pedido para REFUNDED |
| `transaction.refunded` (parcial) | Atualizar pedido para PARTIALLY_REFUNDED |
| `transaction.failed` | Pedido volta para PENDING (se ainda dentro do prazo de 15 min) |

---

## 8. Exemplos Concretos

### Exemplo 1 — Criar pedido com 2 items

**Request:**
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "merchantId": "merchant-uuid-001",
  "items": [
    {
      "productId": "prod_vestido_azul",
      "description": "Vestido Azul Floral Tam M",
      "quantity": 1,
      "unitPriceInCents": 8990
    },
    {
      "productId": "prod_cinto_preto",
      "description": "Cinto Preto Couro",
      "quantity": 2,
      "unitPriceInCents": 3990
    }
  ],
  "idempotencyKey": "ord-idem-uuid-001"
}
```

**Response HTTP 201:**
```json
{
  "data": {
    "orderId": "660f9511-f30c-52e5-b827-557766551111",
    "status": "PENDING",
    "totalInCents": 16970,
    "items": [
      {
        "productId": "prod_vestido_azul",
        "description": "Vestido Azul Floral Tam M",
        "quantity": 1,
        "unitPriceInCents": 8990,
        "subtotalInCents": 8990
      },
      {
        "productId": "prod_cinto_preto",
        "description": "Cinto Preto Couro",
        "quantity": 2,
        "unitPriceInCents": 3990,
        "subtotalInCents": 7980
      }
    ],
    "expiresAt": "2026-05-27T14:15:00Z",
    "createdAt": "2026-05-27T14:00:00Z"
  }
}
```

---

## 9. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| Criar pedido | 30ms | 100ms |
| Consultar pedido | 15ms | 80ms |
| Listar pedidos | 30ms | 150ms |
| Processar evento Kafka | 20ms | 80ms |

---

## 10. Segurança

- `customerId` extraído do JWT — nunca confiar no campo do body para autorização
- `totalInCents` calculado no servidor — nunca confiar no total enviado pelo cliente
- Acesso a pedidos de outros usuários → HTTP 403 (nunca 404)
- Rate limiting: 50 pedidos/min por customerId
