# T13: Client Dashboard

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

Create a dashboard page for CUSTOMER role showing their orders summary and recent transactions.

## Target Files

- `frontend/src/pages/client/client-dashboard-page.tsx` (new)

## Details

1. Welcome message: "Olá, {user.fullName}"
2. Summary cards: Total de Pedidos, Pedidos Pendentes (with Pay CTA), Transações Recentes
3. Quick actions: "Novo Pedido" → `/orders/new`, "Ver Pedidos" → `/orders`
4. Lists: últimos pedidos pendentes (3-5 items), últimas transações (3-5 items), both clickable

**Data:** Reuse existing `useOrdersList` and `useTransactionsList` hooks with appropriate params.

## Acceptance Criteria

- Client dashboard shows user's orders and transactions summary
- "Novo Pedido" navigates to order creation
- Clicking on order navigates to order detail
- Loading/empty/error states handled
- Tests pass

## Traceability

R17
