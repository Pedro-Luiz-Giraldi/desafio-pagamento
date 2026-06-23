---
id: spec-011
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-007-refund-request.md
---
# Transaction Detail

## Context and Primary Objective
- Context: Tela de detalhe completo de uma transação — `/transactions/:id`
- Objective: Exibir dados da transação, histórico de reembolsos e, para MERCHANT_OWNER, o botão de iniciar reembolso

## Functional Requirements (Behavior)
- Business rules:
  - GET /api/v1/transactions/:id retorna dados completos da transação e array de refunds
  - Botão "Reembolsar" visível apenas para MERCHANT_OWNER e apenas se a transação está em status que permite reembolso (APPROVED, PARTIALLY_REFUNDED)
  - Histórico de reembolsos exibido em ordem cronológica reversa (mais recente primeiro)
  - Valor disponível para reembolso = `amountInCents - totalRefundedInCents`

## Acceptance Criteria (BDD)
- Given GET /transactions/:id retorna dados, when MERCHANT_OWNER acessa, then exibe: status, valor total, data, orderId, customerId, e histórico de reembolsos
- Given transação com status APPROVED e sem reembolsos, when MERCHANT_OWNER acessa, then botão "Reembolsar" está visível e ativo
- Given transação FULLY_REFUNDED, when qualquer role acessa, then botão "Reembolsar" não aparece
- Given histórico de reembolsos com 2 entradas, when renderizado, then cada linha mostra: data, valor reembolsado, motivo (label em português), status do reembolso com badge
- Given CUSTOMER acessa /transactions/:id, when autorizado pelo backend (suas próprias transações), then vê os dados mas sem o botão "Reembolsar"
- Given botão "Reembolsar" clicado, when MERCHANT_OWNER clica, then abre o RefundModal (spec-012) na mesma página (sem redirect)
- Given loading, when GET /transactions/:id está em andamento, then skeleton da tela é exibido

## Interface and Data Contracts
```typescript
interface TransactionDetail {
  transactionId: string
  status: TransactionStatus
  amountInCents: number
  totalRefundedInCents: number
  availableForRefundInCents: number
  createdAt: string
  orderId: string
  customerId: string
  cardLastFour: string
  cardBrand: string
  refunds: RefundEntry[]
}

interface RefundEntry {
  refundId: string
  amountInCents: number
  reason: RefundReason
  status: RefundStatus
  createdAt: string
}

// Labels em português para RefundReason
const refundReasonLabels: Record<RefundReason, string> = {
  CUSTOMER_REQUEST: 'Solicitação do cliente',
  DUPLICATE: 'Pagamento duplicado',
  FRAUD: 'Fraude',
  PRODUCT_NOT_DELIVERED: 'Produto não entregue',
}
```

## Tech Stack and Constraints
- Technologies: shadcn/ui Card, Badge, Button; RefundModal como Dialog

## Examples
- Input: `GET /transactions/txn-abc` → transação APPROVED com 1 reembolso parcial
- Output: valor total R$ 99,00, valor disponível R$ 49,50, histórico com 1 linha
