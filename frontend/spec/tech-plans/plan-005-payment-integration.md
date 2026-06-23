---
id: plan-005
status: active
links:
  - spec/tech-plans/index.md
  - spec/specs/spec-009-payment-form.md
---
# Tech Plan: Payment Integration

## Objective
Integrar o MercadoPago SDK client-side para tokenização de cartão sem expor o PAN ao backend do Acabou o Mony.

## Scope
- In scope: carregamento do MP SDK via script tag, inicialização com chave pública, tokenização do cartão, submissão do token via api()
- Out of scope: PIX, boleto, checkout Pro do MercadoPago, Brick de checkout completo (MVP: apenas tokenização de cartão)

## Data Flow
```
index.html carrega <script src="https://sdk.mercadopago.com/js/v2"> →
PaymentForm monta → window.MercadoPago inicializado com VITE_MP_PUBLIC_KEY →
usuário preenche campos (PAN via SDK fields ou CardForm) →
clica "Pagar" → mp.createCardToken({ cardNumber, cardHolder, expirationDate, securityCode }) →
token retornado pelo SDK →
api('/api/v1/transactions', { method: 'POST', body: { cardToken, orderId, amountInCents } }) →
resposta do backend → feedback ao usuário
```

## Implementation Steps

### 1. Carregamento do SDK
```html
<!-- index.html -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```
Adicionar ao CSP do index.html: `script-src 'self' https://sdk.mercadopago.com`

### 2. Tipagem do SDK (src/lib/types/mercadopago.d.ts)
```typescript
declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: object) => MercadoPagoInstance
  }
}
```

### 3. useMercadoPago hook (src/features/transactions/hooks/useMercadoPago.ts)
```typescript
function useMercadoPago(): {
  createCardToken(cardData: CardData): Promise<{ token: string } | { error: string }>
  isReady: boolean
}
// Inicializa window.MercadoPago uma vez com VITE_MP_PUBLIC_KEY
```

### 4. PaymentForm (src/features/transactions/pages/PaymentPage.tsx)
- Verifica status do pedido antes de renderizar (redirect se != PENDING)
- Usa `useMercadoPago()` para tokenização
- Usa `useIdempotencyKey()` para a Idempotency-Key da transação
- Mapeia errorCodes do backend para mensagens amigáveis

### 5. Variável de ambiente
```
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Acceptance Criteria
- PAN nunca aparece em: estado React, console.log, request ao backend, localStorage
- Tokenização funciona com cartão de teste do MercadoPago (`4111111111111111`)
- Erro `CARD_DECLINED` exibe mensagem correta e permite retry com novo cartão
- `SUSPECTED_FRAUD` exibe mensagem genérica sem revelar o motivo
- CSP do index.html permite o script do MercadoPago e bloqueia outros scripts de terceiros
