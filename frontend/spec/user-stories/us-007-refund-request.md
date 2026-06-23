---
id: us-007
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-012-refund-modal.md
  - spec/specs/spec-011-transaction-detail.md
---
# Refund Request

## User Story
Como MERCHANT_OWNER, quero solicitar o reembolso de uma transação para devolver o valor ao cliente.

## Context
Apenas MERCHANT_OWNER pode reembolsar. O reembolso pode ser total ou parcial.
O backend requer Idempotency-Key para evitar reembolsos duplicados.
O motivo do reembolso (RefundReason) é obrigatório.

## Scope
- In scope: modal de reembolso (valor, RefundReason, confirmação), feedback de status do refund, histórico de reembolsos na tela de detalhe
- Out of scope: aprovação de reembolso em múltiplas etapas, reembolso iniciado pelo CUSTOMER

## Acceptance Criteria (BDD)
- Given MERCHANT_OWNER em /transactions/:id, when clica "Reembolsar", then modal abre com campos: valor (pré-preenchido com total disponível), RefundReason (select), e botão de confirmar
- Given valor de reembolso > valor disponível, when tenta confirmar, then Zod/validação exibe erro antes de chamar API
- Given formulário válido, when confirma, then POST /transactions/:id/refund com Idempotency-Key é chamado e modal exibe "Reembolso solicitado com sucesso"
- Given errorCode REFUND_ALREADY_PROCESSED (transação já reembolsada), when backend retorna, then modal exibe mensagem mapeada sem sugerir retry
- Given reembolso bem-sucedido, when modal fecha, then tela de detalhe atualiza status da transação para FULLY_REFUNDED ou PARTIALLY_REFUNDED
- Given histórico de reembolsos, when exibido na tela de detalhe, then mostra cada refund com: data, valor, motivo e status (PENDING/COMPLETED/FAILED)
- Given CUSTOMER autenticado, when tenta acessar /transactions/:id/refund, then RoleRoute bloqueia a ação

## Definition of Done
- [ ] Specs spec-012-refund-modal.md e spec-011-transaction-detail.md escritas e aprovadas
- [ ] Idempotency-Key gerada por operação de refund, reutilizada em retry
- [ ] Todos os RefundReason do backend disponíveis no select com label em português
- [ ] RoleRoute aplicado — apenas MERCHANT_OWNER vê o botão "Reembolsar"
- [ ] Histórico de reembolsos exibido na tela de detalhe
