# T18: My Transactions List

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** T5

## TDD Mode: REQUIRED

## Objective

Modify transactions list page to show only the client's own transactions.

## Target Files

- `frontend/src/pages/transactions/transactions-list-page.tsx`

## Details

1. If role=CUSTOMER, fetch transactions filtered by `customerId={userId}`
2. Keep existing columns and filtering
3. No refund action for CUSTOMER (already handled by backend)

## Acceptance Criteria

- Client sees only their transactions
- Merchant still sees all transactions for their merchant (unchanged)
- Tests pass

## Traceability

R19
