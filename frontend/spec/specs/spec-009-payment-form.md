---
id: spec-009
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-005-payment-flow.md
  - spec/tech-plans/plan-005-payment-integration.md
---
# Payment Form

## Context and Primary Objective
- Context: Formulário de pagamento com cartão — `/orders/:id/pay`
- Objective: Tokenizar dados do cartão via MercadoPago SDK client-side e submeter POST /transactions com o token

## Functional Requirements (Behavior)
- Business rules:
  - Número do cartão NUNCA é enviado ao backend do Acabou o Mony — apenas o token do SDK
  - MP SDK carregado via `<script>` no index.html (sem bundle no app) com chave pública do env
  - Campos do cartão renderizados pelo MP SDK (Brick ou campos customizados) — nunca inputs HTML próprios para PAN
  - POST /transactions requer Idempotency-Key
  - Em caso de erro `retryable: true`, manter a mesma Idempotency-Key e exibir botão "Tentar novamente"
  - Todos os `errorCode` do backend mapeados para mensagens amigáveis

## Acceptance Criteria (BDD)
- Given CUSTOMER em /orders/:id/pay, when SDK carrega, then campos de cartão do MercadoPago são renderizados sem expor o PAN em inputs HTML nativos
- Given dados de cartão válido inseridos, when clica "Pagar", then SDK tokeniza e POST /transactions é chamado com `{ cardToken, orderId, amountInCents, idempotencyKey }`
- Given transação aprovada, when backend retorna APPROVED, then redireciona para /orders/:id com mensagem "Pagamento aprovado!"
- Given `CARD_DECLINED`, when backend retorna, then exibe "Cartão recusado. Verifique os dados ou tente com outro cartão." com botão "Tentar novamente" (nova Idempotency-Key)
- Given `SUSPECTED_FRAUD`, when backend retorna, then exibe "Não foi possível processar o pagamento. Entre em contato com o suporte." sem revelar fraude
- Given `INSUFFICIENT_FUNDS`, when backend retorna, then exibe "Saldo insuficiente. Tente com outro cartão."
- Given timeout (> 10s), when fetch falha, then exibe "Erro de conexão. Verifique sua internet e tente novamente." mantendo a Idempotency-Key atual
- Given pedido não está PENDING (status != PENDING), when CUSTOMER tenta acessar /orders/:id/pay, then redireciona para /orders/:id

## Interface and Data Contracts
```typescript
// POST /api/v1/transactions
// Body:
interface CreateTransactionRequest {
  orderId: string
  cardToken: string       // gerado pelo MP SDK — nunca o PAN
  amountInCents: number
  installments?: number   // MVP: sempre 1
}

// Mapa de errorCodes → mensagens
const paymentErrorMessages: Record<string, string> = {
  CARD_DECLINED: 'Cartão recusado. Verifique os dados ou tente com outro cartão.',
  SUSPECTED_FRAUD: 'Não foi possível processar o pagamento. Entre em contato com o suporte.',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente. Tente com outro cartão.',
  INVALID_CARD: 'Dados do cartão inválidos.',
  CARD_EXPIRED: 'Cartão expirado. Tente com outro cartão.',
  TIMEOUT: 'Erro de conexão. Verifique sua internet e tente novamente.',
}
```

## Tech Stack and Constraints
- Technologies: MercadoPago JS SDK (via script tag), React Hook Form para campos não-sensíveis (nome do titular)
- Constraints: PAN nunca em estado React, console.log ou localStorage; variável de ambiente `VITE_MP_PUBLIC_KEY`

## Examples
- Input: cartão `4111111111111111` (Visa de teste) → SDK tokeniza → `cardToken: 'abc123'`
- POST body: `{ orderId: 'xyz', cardToken: 'abc123', amountInCents: 9900, installments: 1 }`
- Output: redirect para /orders/xyz com toast "Pagamento aprovado!"
