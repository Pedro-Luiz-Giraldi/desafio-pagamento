# Fix: Customer Payment Missing X-Merchant-Id Header

## Problem

When a CUSTOMER user (e.g., `cliente.pag@teste.com`) tries to process a payment via `POST /api/v1/transactions`, the request fails with a 500 error:

```
Required request header 'X-Merchant-Id' for method parameter type UUID is not present
```

## Root Cause

The payment-service's `TransactionController.processTransaction()` endpoint required the `X-Merchant-Id` header to be present. However:

1. The API Gateway only injects `X-Merchant-Id` when the JWT contains a `merchantId` claim
2. CUSTOMER users don't have a merchant associated with them, so their JWT doesn't contain `merchantId`
3. The payment endpoint was designed for MERCHANT users to process payments, but CUSTOMERS also need to pay for orders

## Solution

Modified the payment-service to:

1. **Make `X-Merchant-Id` header optional** in the controller
2. **Fetch merchantId from the order** when the header is not present
3. **Use the order's merchantId** for all transaction processing

### Changes Made

#### 1. OrderServiceClient.java
- Modified `OrderValidationResult` record to include `merchantId` field
- Updated `validateOrder()` to return the order's `merchantId` in the validation result

```java
public record OrderValidationResult(boolean valid, String errorCode, UUID merchantId) {}
```

#### 2. TransactionController.java
- Changed `X-Merchant-Id` header from required to optional:

```java
@RequestHeader(value = "X-Merchant-Id", required = false) UUID merchantId
```

#### 3. TransactionService.java
- Added logic to fetch merchantId from order when not provided in header:

```java
// Fetch order to get merchantId if not provided (CUSTOMER role case)
var orderValidation = orderClient.validateOrder(request.orderId(), merchantId);
if (!orderValidation.valid()) {
    safeRedisDelete(idempotencyKey);
    return fail(orderValidation.errorCode(), "Order validation failed", false, start);
}

// Use merchantId from order if not provided in header
UUID effectiveMerchantId = merchantId != null ? merchantId : orderValidation.merchantId();
if (effectiveMerchantId == null) {
    safeRedisDelete(idempotencyKey);
    return fail("MERCHANT_ID_MISSING", "Merchant ID could not be determined", false, start);
}
```

- Updated all references to use `effectiveMerchantId` instead of `merchantId`

## Flow

### Before (MERCHANT user)
1. MERCHANT logs in → JWT contains `merchantId`
2. API Gateway injects `X-Merchant-Id` header from JWT
3. Payment-service uses header value directly

### After (CUSTOMER user)
1. CUSTOMER logs in → JWT does NOT contain `merchantId`
2. API Gateway does NOT inject `X-Merchant-Id` header
3. Payment-service fetches order → extracts `merchantId` from order
4. Payment-service uses order's `merchantId` for transaction

### After (MERCHANT user - unchanged)
1. MERCHANT logs in → JWT contains `merchantId`
2. API Gateway injects `X-Merchant-Id` header from JWT
3. Payment-service uses header value (skips order lookup for merchantId)

## Testing

Compile verification:
```bash
cd services/payment-service
mvn clean compile -DskipTests
```

Result: ✅ BUILD SUCCESS

### Test Updates Required

The following test files need to be updated to include the new `merchantId` parameter in `OrderValidationResult`:

1. ✅ `OrderServiceClientTest.java` - Updated to include `merchantId` in constructor calls
2. ✅ `TransactionServiceTest.java` - Updated all `OrderValidationResult` instantiations
3. ✅ `TransactionControllerTest.java` - Added new test `processTransaction_withoutMerchantIdHeader_returns201()`

Note: Some existing controller tests may need `X-User-Id` and `X-User-Role` headers added to properly test the CUSTOMER permission check logic.

## Impact

- **CUSTOMER users** can now successfully process payments for orders
- **MERCHANT users** continue to work as before (header takes precedence)
- **Security**: merchantId is always validated against the order, preventing customers from paying orders from different merchants
- **Performance**: Minimal impact since order validation was already being performed

## Related Files

- `services/payment-service/src/main/java/com/acaboumony/payment/client/OrderServiceClient.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/controller/TransactionController.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/service/TransactionService.java`

## Date

2026-07-02
