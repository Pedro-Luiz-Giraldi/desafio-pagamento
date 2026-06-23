---
id: spec-013
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-004-order-creation.md
---
# Customer Dashboard

## Context and Primary Objective
- Context: Dashboard do CUSTOMER — `/dashboard` quando role = CUSTOMER
- Objective: Dar ao CUSTOMER uma visão rápida do estado dos seus pedidos sem precisar navegar para /orders

## Functional Requirements (Behavior)
- Business rules:
  - Dados carregados de GET /api/v1/orders (sem filtro de status = todos)
  - Contadores calculados no frontend com base nos dados retornados
  - Lista de "Últimos pedidos" = primeiros 5 resultados (sem paginação no dashboard)
  - Botão de ação rápida "Criar pedido" proeminente

## Acceptance Criteria (BDD)
- Given CUSTOMER autenticado, when acessa /dashboard, then exibe 3 cards: "Pedidos pendentes" (PENDING), "Pedidos pagos" (PAID), "Pedidos cancelados" (CANCELLED)
- Given GET /orders está carregando, when renderizado, then os 3 cards exibem skeleton
- Given 0 pedidos, when renderizado, then cards exibem "0" e lista mostra "Você ainda não tem pedidos"
- Given pedidos carregados, when lista de últimos pedidos renderizada, then mostra até 5 pedidos com: data, valor, badge de status e link para /orders/:id
- Given MERCHANT_OWNER tenta acessar /dashboard de CUSTOMER, when RoleRoute processa, then redireciona para dashboard de merchant
- Given qualquer card clicado, when clique detectado, then navega para /orders com o filtro de status correspondente pré-aplicado

## Interface and Data Contracts
```typescript
// Dados vêm de GET /api/v1/orders sem filtro
// Contadores calculados no frontend:
const pendingCount = orders.filter(o => o.status === 'PENDING').length
const paidCount = orders.filter(o => o.status === 'PAID').length
const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length

// Últimos 5: orders.slice(0, 5) (já vêm ordenados por createdAt,desc)
```

## Tech Stack and Constraints
- Technologies: shadcn/ui Card, Badge, Skeleton, Button
- Constraints: sem endpoint dedicado de dashboard; agrega dados do endpoint de listagem

## Examples
- Input: GET /orders retorna 12 pedidos (5 PENDING, 4 PAID, 3 CANCELLED)
- Output: cards mostrando 5 | 4 | 3, lista com os 5 mais recentes
