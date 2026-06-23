---
id: spec-012
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-007-refund-request.md
  - spec/specs/spec-011-transaction-detail.md
---
# Refund Modal

## Context and Primary Objective
- Context: Modal de solicitação de reembolso — abre sobre /transactions/:id
- Objective: Permitir que MERCHANT_OWNER informe valor e motivo do reembolso com segurança de idempotência

## Functional Requirements (Behavior)
- Business rules:
  - Campo de valor pré-preenchido com `availableForRefundInCents` convertido para R$
  - Valor máximo = `availableForRefundInCents`; valor mínimo = R$ 0,01 (1 centavo)
  - RefundReason obrigatório (select)
  - Idempotency-Key gerado por abertura do modal — mesma key mantida se retry com `retryable: true`
  - Nova Idempotency-Key apenas ao fechar e reabrir o modal, ou após sucesso

## Acceptance Criteria (BDD)
- Given modal abre, when renderizado, then campo de valor pré-preenchido com valor total disponível em R$
- Given valor de reembolso > disponível, when sai do campo, then Zod exibe "Valor excede o disponível para reembolso"
- Given valor = 0, when sai do campo, then Zod exibe "Valor deve ser maior que zero"
- Given formulário válido, when clica "Confirmar reembolso", then botão mostra spinner, POST /transactions/:id/refund é chamado com Idempotency-Key
- Given REFUND_SUCCESS, when backend retorna 200, then modal exibe "Reembolso solicitado com sucesso" e fecha após 2 segundos; tela de detalhe atualiza
- Given `REFUND_ALREADY_PROCESSED`, when backend retorna errorCode, then exibe "Este reembolso já foi processado." sem botão de retry
- Given erro retryable, when backend retorna `retryable: true`, then exibe "Erro ao processar. Tente novamente." com botão "Tentar novamente" e mantém a mesma Idempotency-Key
- Given modal fechado sem confirmar, when usuário clica no X ou fora do modal, then nenhuma chamada de API é feita

## Interface and Data Contracts
```typescript
const refundSchema = z.object({
  amountInCents: z.number()
    .min(1, 'Valor deve ser maior que zero')
    .max(availableForRefundInCents, 'Valor excede o disponível para reembolso'),
  reason: z.enum(['CUSTOMER_REQUEST', 'DUPLICATE', 'FRAUD', 'PRODUCT_NOT_DELIVERED'], {
    required_error: 'Selecione o motivo do reembolso',
  }),
})

// POST /api/v1/transactions/:id/refund
// Headers: Idempotency-Key: <uuid>
// Body: { amountInCents: number, reason: RefundReason }
```

## Tech Stack and Constraints
- Technologies: shadcn/ui Dialog, React Hook Form, Zod, `useIdempotencyKey` hook

## Examples
- Input: `{ amountInCents: 4950, reason: 'CUSTOMER_REQUEST' }` + Header `Idempotency-Key: uuid-123`
- Output (sucesso): `{ data: { refundId: 'ref-abc', status: 'PENDING' } }` → modal fecha, detalhe atualiza
