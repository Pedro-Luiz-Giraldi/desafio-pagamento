# T17: Payment Page

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** T5

## TDD Mode: REQUIRED

## Objective

Create the payment page with card form, MercadoPago tokenization, and payment processing.

## Target Files

- `frontend/src/pages/client/pay-order-page.tsx` (new)
- `frontend/src/api/transactions.api.ts` (add `create()` method)
- `frontend/src/hooks/use-transactions.ts` (add mutation)

## Details

1. **Load order info:** Fetch order details, verify PENDING, show summary
2. **Card form:** Load MP JS SDK, initialize with `VITE_MP_PUBLIC_KEY`, card fields + installments, tokenize via `createCardToken()`
3. **Process payment:** Send to `POST /api/v1/transactions` with cardToken, amount, customerId, orderId
4. **Result:** Success → redirect to `/orders/{orderId}`; Failed → show error + retry; Processing → show status

## Acceptance Criteria

- Order info loads and displays correctly
- Card form renders with MP SDK tokenization
- Successful payment redirects to order detail (PAID)
- Failed payment shows error and option to retry
- Backend receives correct request

## Traceability

R22, R23, R24, R25
