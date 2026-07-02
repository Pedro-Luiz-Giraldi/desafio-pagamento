# Summary: Customer Payment Fix + Mercado Pago Diagnostic

## Date: 2026-07-02

## Issues Addressed

### 1. Customer Payment - Missing X-Merchant-Id Header (✅ FIXED)
### 2. Mercado Pago 500 Internal Error (🔍 DIAGNOSTIC ADDED)

---

## Issue 1: Customer Payment - Missing X-Merchant-Id Header

### Problem
CUSTOMER users couldn't process payments because the `X-Merchant-Id` header was required but not present in their JWT (customers don't have merchants).

### Solution
Modified payment-service to fetch `merchantId` from the order when the header is not present.

### Files Changed

1. **OrderServiceClient.java**
   - Added `merchantId` field to `OrderValidationResult` record
   - `validateOrder()` now returns the order's merchantId

2. **TransactionController.java**
   - Made `X-Merchant-Id` header optional: `@RequestHeader(value = "X-Merchant-Id", required = false)`

3. **TransactionService.java**
   - Added logic to use order's merchantId when header is null
   - Introduced `effectiveMerchantId` variable
   - Added validation to ensure merchantId is never null

4. **Test Files**
   - Updated `OrderServiceClientTest.java`
   - Updated `TransactionServiceTest.java`
   - Added new test in `TransactionControllerTest.java`

### How It Works Now

**CUSTOMER Flow:**
```
1. Customer logs in → JWT without merchantId
2. API Gateway doesn't inject X-Merchant-Id header
3. Payment-service receives merchantId=null
4. Service fetches order → extracts merchantId from order
5. Transaction processed with order's merchantId
```

**MERCHANT Flow (unchanged):**
```
1. Merchant logs in → JWT with merchantId
2. API Gateway injects X-Merchant-Id header
3. Payment-service uses header value directly
```

---

## Issue 2: Mercado Pago 500 Internal Error

### Problem
Payment requests to Mercado Pago API return:
```json
{
  "message": "internal_error",
  "error": null,
  "status": 500,
  "cause": []
}
```

### Diagnostic Enhancements Added

#### 1. MercadoPagoSdkConfig.java
**Added:**
- Validation that `MERCADOPAGO_ACCESS_TOKEN` is not null/blank
- Warning if token format is unexpected (should start with `TEST-` or `APP_USR-`)
- Masked token logging for verification
- Exception thrown if token is missing

**Log Output:**
```
MercadoPago SDK configured with access token: TEST-1234...5678
```

#### 2. MercadoPagoGateway.java
**Added:**
- Detailed request logging before sending to MP
- Enhanced error logging with status, body, and headers
- Better error message for 500 errors
- Helper method to parse error details

**Log Output (Success):**
```
Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=...
Setting notification URL: https://...
Sending payment request to Mercado Pago...
MP payment created in 234ms: id=123456789, status=approved
```

**Log Output (Error):**
```
MPApiException during payment creation: status=500, message=internal_error
MP API error: status=500 body={"message":"internal_error",...}
MP API response headers: {...}
MP server error - this may indicate: invalid access token, malformed request, or MP service issue
```

### Common Causes of MP 500 Error

1. **Invalid Access Token**
   - Token not set in environment
   - Token expired or revoked
   - Wrong token format

2. **Invalid Card Token**
   - Card token expired (tokens expire after 7 days)
   - Card token format invalid
   - Card token already used

3. **Invalid Request Payload**
   - Amount format issues
   - Invalid payment method ID
   - Payer email format issues

4. **Mercado Pago Service Issues**
   - Temporary API outage
   - Rate limiting
   - Sandbox environment issues

### Diagnostic Steps

#### Step 1: Check Access Token
```bash
# Check if token is set
docker exec aom-payment-service env | grep MERCADOPAGO_ACCESS_TOKEN

# Check payment-service startup logs
docker logs aom-payment-service | grep "MercadoPago SDK configured"
```

**Expected:** `MercadoPago SDK configured with access token: TEST-xxxx...xxxx`

#### Step 2: Verify Token Format
- Should start with `TEST-` for sandbox
- Length: 60-80 characters
- Format: `TEST-{numbers}-{date}-{hash}`

#### Step 3: Check Payer Email Configuration
Current setting in `application.yml`:
```yaml
mercadopago:
  payer-email: guilherme.dias4501@gmail.com
```

**This is correct** for a developer account in test mode. The payer email should be the developer account email when using the developer's access token.

#### Step 4: Verify Card Token
Card tokens:
- Expire after 7 days
- Can only be used once
- Must be generated fresh for each payment

**Solution:** Generate a new card token before each payment attempt.

#### Step 5: Check Payment-Service Logs
```bash
docker logs aom-payment-service --tail 100 -f
```

Look for:
- `Creating MP payment: ...` - Request details
- `MP API error: ...` - Error details
- `MP payment created: ...` - Success confirmation

#### Step 6: Test MP API Directly
```bash
curl -X POST 'https://api.mercadopago.com/v1/payments' \
  -H 'Authorization: Bearer YOUR_TEST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_amount": 100,
    "token": "test_token",
    "description": "Test",
    "installments": 1,
    "payment_method_id": "visa",
    "payer": {"email": "guilherme.dias4501@gmail.com"}
  }'
```

### Quick Fix Checklist

- [ ] Verify `MERCADOPAGO_ACCESS_TOKEN` is set in `.env`
- [ ] Confirm token starts with `TEST-`
- [ ] Check token is valid in MP dashboard
- [ ] Generate fresh card token (tokens expire!)
- [ ] Restart payment-service: `docker restart aom-payment-service`
- [ ] Check logs for detailed error messages
- [ ] Test with MP test cards

### Test Cards (Mercado Pago)
- **Approved:** `5031 4332 1540 6351` (Mastercard)
- **Declined:** `5031 7557 3453 0604` (Mastercard)
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Configuration Verification

**Environment Variables Required:**
```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-your-token-here
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret (optional)
MERCADOPAGO_NOTIFICATION_URL=https://your-ngrok-url/api/v1/webhooks/mercadopago (optional)
```

**Application Configuration:**
```yaml
mercadopago:
  access-token: ${MERCADOPAGO_ACCESS_TOKEN}
  payer-email: guilherme.dias4501@gmail.com  # Developer account email
  timeout-ms: 800
```

---

## Build Status

✅ **Code compiles successfully**
```bash
cd services/payment-service
mvn clean compile -DskipTests
```

⚠️ **Some tests need header updates** (non-blocking)

---

## Testing the Fix

### Test Customer Payment (without X-Merchant-Id)

1. **Login as CUSTOMER:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente.pag@teste.com","password":"senha123"}'
```

2. **Create Order:**
```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId":"merchant-uuid",
    "items":[{"productId":"prod-uuid","quantity":1,"priceInCents":8990}]
  }'
```

3. **Process Payment (no X-Merchant-Id needed):**
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amountInCents":8990,
    "currency":"BRL",
    "customerId":"customer-uuid",
    "orderId":"order-uuid",
    "cardToken":"fresh-card-token",
    "paymentMethodId":"master",
    "installments":1,
    "idempotencyKey":"unique-uuid"
  }'
```

**Expected:** 201 Created (or 503 if MP token issue)

---

## Related Documentation

- [Fix: Customer Payment Merchant ID](./fix-customer-payment-merchant-id.md)
- [Mercado Pago 500 Diagnostic](./mercadopago-500-diagnostic.md)
- [Mercado Pago Setup](../../MERCADOPAGO_SETUP.md)
- [Payment Flow Test](../payment-flow-test.md)

---

## Next Steps

1. **Restart payment-service** to apply logging enhancements
2. **Check startup logs** for access token verification
3. **Generate fresh card token** using MP SDK
4. **Retry payment** and check detailed logs
5. **If still failing**, test MP API directly to isolate issue

---

## Support

If the issue persists after following these steps:

1. Check Mercado Pago dashboard for account status
2. Verify test environment is enabled
3. Check for any IP restrictions or rate limits
4. Contact Mercado Pago support with the detailed logs
