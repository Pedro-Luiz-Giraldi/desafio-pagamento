# Mercado Pago 500 Error Diagnostic

## Error Details

**Error Message:** `MP API error: status=500 body={"message":"internal_error","error":null,"status":500,"cause":[]}`

**HTTP Status:** 503 (from payment-service, due to MP returning 500)

## Common Causes of MP 500 Internal Error

1. **Invalid or Missing Access Token**
   - Token not set in environment
   - Token format incorrect (should start with `TEST-` for sandbox)
   - Token expired or revoked

2. **Invalid Request Payload**
   - Missing required fields
   - Invalid data types or formats
   - Payer email format issues

3. **Mercado Pago Service Issues**
   - Temporary outage
   - Rate limiting
   - Sandbox environment issues

## Diagnostic Steps

### 1. Verify Access Token is Set

Check the payment-service logs on startup for:
```
MercadoPago SDK configured with access token: TEST-xxxxx...xxxx
```

If you see:
- `MERCADOPAGO_ACCESS_TOKEN is not set!` → Token missing from environment
- Token doesn't start with `TEST-` → Using production token in sandbox mode

### 2. Check Environment Variables

```bash
# Check if token is set in docker
docker exec aom-payment-service env | grep MERCADOPAGO_ACCESS_TOKEN

# Should output something like:
# MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef-...
```

### 3. Verify Token Format

Valid Mercado Pago test tokens:
- **Format:** `TEST-{numbers}-{date}-{hash}`
- **Example:** `TEST-1234567890-123456-abcdef1234567890abcdef1234567890`
- **Length:** Usually 60-80 characters

### 4. Check Request Payload

The payment-service now logs detailed request information:
```
Creating MP payment: amount={cents}, paymentMethod={id}, installments={n}, orderId={uuid}, email={email}
```

Verify:
- ✅ Amount is in cents (e.g., 8990 for R$ 89.90)
- ✅ Payment method ID is valid (visa, master, etc.)
- ✅ Installments is between 1-12
- ✅ Email format is valid

### 5. Check Payer Email

The `payer-email` in `application.yml` is set to `guilherme.dias4501@gmail.com` (developer account email).

**Important:** For Mercado Pago test environment, the payer email should be a test user email, not the developer account email.

#### Create Test Users

1. Go to: https://www.mercadopago.com.br/developers/panel/test-users
2. Create a test buyer user
3. Use that email as the payer email

Or use Mercado Pago's default test emails:
- `test_user_123456@testuser.com`
- Any email ending in `@testuser.com`

### 6. Enhanced Logging

The following enhancements were added to help diagnose issues:

**MercadoPagoSdkConfig.java:**
- Validates token is not null/blank
- Warns if token format is unexpected
- Logs masked token on startup

**MercadoPagoGateway.java:**
- Logs request details before sending to MP
- Logs detailed error information from MP API
- Logs response headers for debugging

## Quick Fix Checklist

- [ ] Verify `MERCADOPAGO_ACCESS_TOKEN` is set in `.env` file
- [ ] Confirm token starts with `TEST-` for sandbox
- [ ] Check token is valid (not expired/revoked) in MP dashboard
- [ ] Verify payer email is a test user email (not developer account)
- [ ] Restart payment-service after changing environment variables
- [ ] Check payment-service logs for detailed error messages
- [ ] Test with a valid test card token

## Test Card Tokens

For testing, you can generate card tokens using MP's test cards:
- **Approved:** `5031 4332 1540 6351` (Mastercard)
- **Declined:** `5031 7557 3453 0604` (Mastercard)

## Verification Commands

```bash
# 1. Check if payment-service is running
docker ps | grep payment-service

# 2. Check payment-service logs
docker logs aom-payment-service --tail 100

# 3. Check environment variable
docker exec aom-payment-service env | grep MERCADOPAGO

# 4. Test MP API directly (replace TOKEN)
curl -X POST \
  'https://api.mercadopago.com/v1/payments' \
  -H 'Authorization: Bearer TEST-YOUR-TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_amount": 100,
    "token": "test_token",
    "description": "Test",
    "installments": 1,
    "payment_method_id": "visa",
    "payer": {
      "email": "test@testuser.com"
    }
  }'
```

## Expected Log Output (Success)

```
MercadoPago SDK configured with access token: TEST-1234...5678
Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=test@testuser.com
Setting notification URL: https://...
Sending payment request to Mercado Pago...
MP payment created in 234ms: id=123456789, status=approved
Transaction txn_abc123 approved in 456ms
```

## Expected Log Output (Failure)

```
MercadoPago SDK configured with access token: TEST-1234...5678
Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=test@testuser.com
MPApiException during payment creation: status=500, message=internal_error
MP API error: status=500 body={"message":"internal_error","error":null,"status":500,"cause":[]}
MP API response headers: {...}
MP server error - this may indicate: invalid access token, malformed request, or MP service issue
```

## Next Steps

1. **Check the logs** after restarting payment-service
2. **Verify the access token** format and validity
3. **Test with MP's API directly** to isolate the issue
4. **Check MP dashboard** for any account issues or restrictions

## Related Files

- `services/payment-service/src/main/java/com/acaboumony/payment/config/MercadoPagoSdkConfig.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java`
- `services/payment-service/src/main/resources/application.yml`
- `.env` (not in git - check your local copy)

## Date

2026-07-02
