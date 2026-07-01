# T14: Merchants List Page

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** T2

## TDD Mode: REQUIRED

## Objective

Create a page for clients to browse available merchants.

## Target Files

- `frontend/src/pages/client/merchants-list-page.tsx` (new)
- `frontend/src/pages/client/merchant-detail-page.tsx` (new)
- `frontend/src/api/merchants.api.ts` (new)
- `frontend/src/hooks/use-merchants.ts` (new)

## Details

1. `merchants.api.ts`: `list()` → `GET /api/v1/merchants`, `getById(id)` → `GET /api/v1/merchants/{id}`
2. `use-merchants.ts`: `useMerchants()`, `useMerchant(id)` — TanStack Query hooks
3. `merchants-list-page.tsx`: list of merchants (companyName, click to detail), each card has "Criar Pedido" → `/orders/new?merchantId={id}`
4. `merchant-detail-page.tsx`: shows merchant name, info, "Criar Pedido" button

## Acceptance Criteria

- Client sees list of active merchants
- Clicking merchant shows their info
- "Criar Pedido" navigates to order creation with merchant preselected
- Tests pass

## Traceability

R20
