# T11: Products List Page (Merchant, Read-Only)

**Phase:** 3 — Merchant Frontend
**Service:** frontend
**Dependencies:** T3

## TDD Mode: REQUIRED

## Objective

Create a page for merchants to view their product catalog.

## Target Files

- `frontend/src/pages/merchant/products-page.tsx` (new)
- `frontend/src/api/products.api.ts` (new)
- `frontend/src/hooks/use-products.ts` (new)

## Details

1. `products.api.ts` — `listByMerchant(merchantId: string): Promise<Product[]>`
2. `use-products.ts` — `useProducts(merchantId)` query via TanStack Query
3. `products-page.tsx` — table/list showing: name, description, price, active status
4. Read-only — no create/edit/delete

## Acceptance Criteria

- Merchant can navigate to `/products` and see their products
- Shows name, description, price, status for each product
- Loading/empty/error states handled
- Tests pass

## Traceability

R27
