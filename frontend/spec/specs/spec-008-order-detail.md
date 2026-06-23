---
id: spec-008
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-004-order-creation.md
---
# Order Detail

## Context and Primary Objective
- Context: Tela de detalhe de um pedido — `/orders/:id`
- Objective: Exibir dados completos do pedido, timer de expiração (se PENDING), e ações disponíveis por status e role

## Functional Requirements (Behavior)
- Business rules:
  - GET /api/v1/orders/:id retorna os dados completos do pedido
  - Se status = PENDING → exibir timer regressivo baseado em `expiresAt` (15 min após `createdAt`)
  - Timer chega a zero → atualizar status para "Expirado" sem chamar o backend (o backend cancela automaticamente)
  - Botão "Pagar agora" → navega para `/orders/:id/pay` — visível apenas se PENDING e CUSTOMER
  - Botão "Cancelar pedido" → DELETE /orders/:id — visível apenas se PENDING e CUSTOMER
  - Botão "Cancelar" não aparece para MERCHANT_OWNER (apenas leitura)

## Acceptance Criteria (BDD)
- Given pedido PENDING com 10 minutos restantes, when CUSTOMER acessa /orders/:id, then timer regressivo (MM:SS) é exibido e decrementa em tempo real
- Given timer chegou a zero, when renderizado, then badge muda para "Expirado" e botões "Pagar" e "Cancelar" desaparecem
- Given pedido PAID, when qualquer role acessa, then exibe badge "Pago" sem timer e sem botões de ação
- Given CUSTOMER clica "Cancelar pedido", when modal de confirmação aparece e confirma, then DELETE /orders/:id é chamado e status atualiza para CANCELLED
- Given DELETE retorna erro, when MERCHANT_OWNER tenta cancelar (não deveria poder), then ação não está disponível na UI (RoleRoute bloqueia)
- Given loading, when GET /orders/:id está em andamento, then skeleton completo da tela é exibido
- Given orderId inválido ou sem acesso, when GET retorna 404, then exibe "Pedido não encontrado" com link para /orders

## Interface and Data Contracts
```typescript
interface OrderDetail {
  orderId: string
  status: OrderStatus
  totalAmountInCents: number
  createdAt: string    // ISO-8601
  expiresAt: string    // ISO-8601 (createdAt + 15min)
  customerId: string
  items?: OrderItem[]
}
```

## Tech Stack and Constraints
- Technologies: `useEffect` + `setInterval` para timer, shadcn/ui Badge, Button, Dialog (modal de confirmação)

## Examples
- Input: `GET /orders/abc123` → pedido PENDING criado há 3 minutos
- Output: timer mostrando "12:00" decrementando, botões "Pagar agora" e "Cancelar pedido"
