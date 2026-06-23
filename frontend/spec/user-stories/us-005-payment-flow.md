---
id: us-005
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-009-payment-form.md
---
# Payment Flow

## User Story
Como CUSTOMER, quero pagar um pedido com cartão de crédito para concluir minha compra.

## Context
O pagamento usa tokenização client-side via MercadoPago SDK. O número do cartão NUNCA chega ao backend
do Acabou o Mony — apenas o token gerado pelo SDK. O backend retorna sucesso ou errorCode mapeável.

## Scope
- In scope: tokenização client-side via MP SDK, POST /transactions com Idempotency-Key, feedback por errorCode, retry em caso retryable
- Out of scope: PIX, boleto, parcelamento (MVP = apenas cartão de crédito)

## Acceptance Criteria (BDD)
- Given CUSTOMER em /orders/:id/pay, when preenche dados do cartão válido e submete, then SDK tokeniza, POST /transactions é chamado com o token, e frontend redireciona para /orders/:id com status PAID
- Given cartão recusado (CARD_DECLINED), when backend retorna errorCode, then frontend exibe "Cartão recusado. Verifique os dados ou tente outro cartão." com opção de retry
- Given suspeita de fraude (SUSPECTED_FRAUD), when backend retorna errorCode, then frontend exibe mensagem genérica "Não foi possível processar o pagamento" sem revelar o motivo real
- Given timeout na chamada ao backend (> 10s), when request falha, then frontend exibe "Erro de conexão. Tente novamente." e mantém a Idempotency-Key para retry seguro
- Given retry com mesma Idempotency-Key, when backend já processou a transação, then retorna 200 com resultado original sem duplicar cobrança
- Given número de cartão inválido no formulário, when sai do campo, then SDK ou validação local exibe erro antes de chamar o backend

## Definition of Done
- [ ] Spec spec-009-payment-form.md escrita e aprovada
- [ ] Número do cartão nunca enviado ao backend — apenas o token
- [ ] Todos os errorCodes do backend mapeados para mensagem amigável
- [ ] Idempotency-Key reutilizada em retries; descartada após sucesso ou erro não-retryável
- [ ] Nenhum dado de cartão em console.log, localStorage ou URL
