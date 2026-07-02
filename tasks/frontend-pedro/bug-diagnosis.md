# Bug Diagnosis: Payment failures with Mercado Pago

## Bug Summary
Two distinct issues cause payment failures when testing with Mercado Pago:

1. Mastercard test card 5031 4332 1540 6351 returns CARD_DECLINED (422)
2. Visa test card 4235 6477 2802 5682 returns cc_rejected_other_reason (500)

## Root Causes

### Issue 1: Incorrect Mastercard brand detection (frontend)
**File:** `frontend/src/lib/card-utils.ts:14`

The `detectCardBrand()` function has an incomplete Mastercard BIN range:
```typescript
if (/^5[1-5]/.test(cleaned) ...  // only 51-55
```

Mastercard BINs include the **50-55** range. The test card 5031 4332 1540 6351 starts with **5031** (Mastercard), but the regex only matches 51-55, so it falls through to the default `'visa'`.

**Result:** Frontend sends `paymentMethodId: "visa"` for a Mastercard card → MP rejects with CARD_DECLINED.

### Issue 2: Missing error code mapping (backend)
**File:** `services/payment-service/src/main/java/com/acaboumony/payment/controller/TransactionController.java:221`

The `errorHttpStatus()` switch statement does not include Mercado Pago's rejection codes like `cc_rejected_other_reason`, `cc_rejected_insufficient_amount`, etc. These fall to the `default` case which returns `HttpStatus.INTERNAL_SERVER_ERROR` (500).

**Result:** A perfectly normal card decline returns 500 instead of 422 UNPROCESSABLE_ENTITY, which could trigger incorrect retry logic.

### Issue 3: Overly narrow retryable logic (backend)
**File:** `services/payment-service/src/main/java/com/acaboumony/payment/service/TransactionService.java:187`

The `retryable` flag is set to `!"CARD_DECLINED".equals(errorCode)`, meaning only the exact string "CARD_DECLINED" is non-retryable. All other MP decline codes (like `cc_rejected_other_reason`) are incorrectly marked as retryable.

## Proposed Fixes
1. Update Mastercard regex from `^5[1-5]` to `^5[0-5]` in `card-utils.ts`
2. Add `cc_rejected_other_reason` (and generic MP rejection pattern) to the 422 mapping in `TransactionController.java`
3. Improve retryable logic to treat all card-decline-type errors as non-retryable

## Affected Files
- `frontend/src/lib/card-utils.ts`
- `services/payment-service/src/main/java/com/acaboumony/payment/controller/TransactionController.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/service/TransactionService.java`

## Evidence
- Request 1: `paymentMethodId:"visa"` for Mastercard card 5031... → CARD_DECLINED
- Request 2: `paymentMethodId:"visa"` for Visa card 4235... → 500 with cc_rejected_other_reason
- `errorHttpStatus()` has no case for `cc_rejected_*` codes → defaults to 500
- `retryable` logic is inverted for MP-specific rejection codes
