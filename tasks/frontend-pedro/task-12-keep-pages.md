# T12: Keep Existing Merchant Pages Unchanged

**Phase:** 3 — Merchant Frontend
**Service:** frontend
**Dependencies:** None

## TDD Mode: NOT REQUIRED (no code changes — just verification)

## Objective

Verify that existing merchant pages (orders list, order detail, transactions list, transaction detail, settings, 2FA) work without changes for MERCHANT_OWNER role.

## Target Files

No code changes — verification only.

## Details

1. Existing pages already filter by X-User-Id / X-Merchant-Id from gateway headers
2. MERCHANT_OWNER sees all orders for their merchant (existing behavior)
3. No code changes needed — just verify no regressions

## Acceptance Criteria

- Merchant can view orders (all for their merchant) unchanged
- Merchant can view order detail unchanged
- Merchant can view transactions list unchanged
- Merchant can view transaction detail unchanged
- Merchant can access settings/2FA unchanged

## Traceability

R12, R13, R14, R15, R16
