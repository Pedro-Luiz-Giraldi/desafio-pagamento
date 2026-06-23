---
id: us-004
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-007-orders-list.md
  - spec/specs/spec-008-order-detail.md
---
# Order Creation

## User Story
Como CUSTOMER, quero criar um pedido para registrar minha intenção de compra antes de pagar.

## Context
Um pedido (Order) é criado antes do pagamento. Ele fica em status PENDING por 15 minutos.
Se não for pago nesse prazo, expira automaticamente (o backend cuida do cancelamento).
O frontend deve exibir o timer regressivo e bloquear a criação de novo pedido se houver um PENDING.

## Scope
- In scope: criar pedido (POST /orders com Idempotency-Key), listar pedidos, ver detalhe, cancelar pedido PENDING
- Out of scope: editar pedido após criação, criar múltiplos pedidos simultâneos

## Acceptance Criteria (BDD)
- Given CUSTOMER autenticado, when acessa /orders/new e preenche os campos, then POST /orders cria pedido e redireciona para /orders/:id
- Given pedido criado, when está em /orders/:id, then exibe timer regressivo de 15 minutos e botão "Pagar agora"
- Given pedido PENDING, when CUSTOMER clica "Cancelar", then DELETE /orders/:id cancela e atualiza status para CANCELLED
- Given pedido com status != PENDING, when CUSTOMER tenta cancelar, then botão "Cancelar" não aparece
- Given Idempotency-Key duplicada (retry do mesmo pedido), when backend retorna 200 com pedido existente, then frontend exibe o pedido existente sem erro
- Given lista de pedidos, when CUSTOMER acessa /orders, then vê seus pedidos com filtro por status e paginação

## Definition of Done
- [ ] Specs spec-007 e spec-008 escritas e aprovadas
- [ ] Idempotency-Key gerada e injetada pelo hook useIdempotencyKey()
- [ ] Timer regressivo de 15 minutos implementado com lógica de expiração
- [ ] Filtros de status e paginação funcionando
- [ ] Estados de loading, erro e vazio tratados em todas as telas
