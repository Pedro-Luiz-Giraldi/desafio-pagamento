# Quick Fix: MercadoPago 500 Internal Server Error

**Created:** 2026-07-02  
**Status:** In Progress  
**Type:** Bug Fix - Critical

## Problem

Transaction creation fails with 500 error from MercadoPago API.

### Error Details

**Frontend:**
```
Cookie "x-meli-session-id" has been rejected for invalid domain
POST /api/v1/transactions HTTP/1.1 500 Internal Server Error
```

**Backend Logs:**
```
MP API error: status=500 body={"message":"internal_error","error":null,"status":500,"cause":[]}
MPApiException during payment creation: status=500, message=Api error. Check response for details
MP server error - this may indicate: invalid access token, malformed request, or MP service issue
```

**API Response:**
```json
{
  "data": {
    "status": "FAILURE",
    "processingTimeMs": 4288
  },
  "errors": [{
    "message": "Payment gateway error",
    "code": "MP_SERVER_ERROR",
    "retryable": true
  }]
}
```

## Root Causes (Priority Order)

### 1. Invalid/Missing Access Token ⚠️ MOST LIKELY
- Token not set in environment
- Token format incorrect (should start with `TEST-`)
- Token expired or revoked

### 2. Wrong Payer Email Configuration
- Current: `payer-email: guilherme.dias4501@gmail.com` (developer account)
- Should be: Test user email (e.g., `test_user_123@testuser.com`)
- MercadoPago test environment rejects developer account emails

### 3. Missing Frontend Public Key
- Frontend needs `VITE_MP_PUBLIC_KEY` to generate valid card tokens
- Without it, invalid tokens are sent to backend

## Diagnostic Steps

### Step 1: Verify Access Token

```bash
# Check if token is set
docker exec aom-payment-service env | grep MERCADOPAGO_ACCESS_TOKEN

# Check payment-service startup logs
docker logs aom-payment-service | grep "MercadoPago SDK configured"
```

**Expected output:**
```
MercadoPago SDK configured with access token: TEST-1234...5678
```

**If missing or wrong format:**
- Token should start with `TEST-` for sandbox
- Length: 60-80 characters
- Format: `TEST-{numbers}-{date}-{hash}`

### Step 2: Check Frontend Public Key

```bash
# Check if frontend has public key
cat frontend/.env.local | grep VITE_MP_PUBLIC_KEY
```

**If missing:**
- Create `frontend/.env.local`
- Add: `VITE_MP_PUBLIC_KEY=TEST-your-public-key-here`

### Step 3: Test MercadoPago API Directly

```bash
# Test if credentials work (replace TOKEN)
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
    "payer": {"email": "test@testuser.com"}
  }'
```

**Expected responses:**
- `201 Created` = Credentials valid ✅
- `401 Unauthorized` = Invalid access token ❌
- `400/422` = Invalid data (but token works)
- `500` = Check all parameters

## Solution

### Fix 1: Configure Access Token (REQUIRED)

1. Get your test credentials from MercadoPago:
   - Go to: https://www.mercadopago.com.br/developers/panel
   - Navigate to "Suas aplicações" → Select/Create app
   - Go to "Credenciais de teste"
   - Copy **Access Token** (starts with `TEST-`)

2. Update `.env` file:
   ```bash
   MERCADOPAGO_ACCESS_TOKEN=TEST-your-actual-token-here
   ```

3. Restart payment-service:
   ```bash
   docker-compose restart payment-service
   ```

### Fix 2: Configure Frontend Public Key (REQUIRED)

1. Get Public Key from same place as Access Token

2. Create `frontend/.env.local`:
   ```bash
   VITE_MP_PUBLIC_KEY=TEST-your-public-key-here
   ```

3. Restart frontend:
   ```bash
   cd frontend && npm run dev
   ```

### Fix 3: Update Payer Email (RECOMMENDED)

**Option A: Use Test User Email**

Edit `services/payment-service/src/main/resources/application.yml`:

```yaml
mercadopago:
  access-token: ${MERCADOPAGO_ACCESS_TOKEN}
  webhook-secret: ${MERCADOPAGO_WEBHOOK_SECRET:}
  notification-url: ${MERCADOPAGO_NOTIFICATION_URL:https://squabble-engulf-ocean.ngrok-free.dev/api/v1/webhooks/mercadopago}
  payer-email: test_user_123@testuser.com  # Changed from developer email
```

**Option B: Create Proper Test User**

1. Go to: https://www.mercadopago.com.br/developers/panel/test-users
2. Create a test buyer user
3. Use that email in configuration

Then restart:
```bash
docker-compose restart payment-service
```

## Verification

### 1. Check Logs After Restart

```bash
docker logs aom-payment-service --tail 50 -f
```

**Success indicators:**
```
✅ MercadoPago SDK configured with access token: TEST-1234...5678
✅ Creating MP payment: amount=8990, paymentMethod=master, installments=1
✅ MP payment created in 234ms: id=123456789, status=approved
```

**Failure indicators:**
```
❌ MERCADOPAGO_ACCESS_TOKEN is not set!
❌ Access token does not start with TEST-
❌ MPApiException during payment creation: status=500
```

### 2. Test Payment Flow

Use MercadoPago test card:
- **Card**: 5031 4332 1540 6351
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: Any name
- **Brand**: Mastercard (auto-detected)

### 3. Check Browser Console

Open DevTools → Console:
- ✅ `window.MercadoPago` should be defined
- ✅ No SDK loading errors
- ⚠️ Cookie warning is expected in localhost (doesn't prevent payment)

## Quick Checklist

- [ ] Verify `MERCADOPAGO_ACCESS_TOKEN` is set in `.env`
- [ ] Confirm token starts with `TEST-`
- [ ] Check token is valid (not expired) in MP dashboard
- [ ] Create `frontend/.env.local` with `VITE_MP_PUBLIC_KEY`
- [ ] Verify public key starts with `TEST-`
- [ ] Update payer email to test user email (optional but recommended)
- [ ] Restart payment-service: `docker-compose restart payment-service`
- [ ] Restart frontend: `cd frontend && npm run dev`
- [ ] Check payment-service logs for startup confirmation
- [ ] Test with valid test card
- [ ] Verify transaction completes successfully

## Related Files

- `services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/config/MercadoPagoSdkConfig.java`
- `services/payment-service/src/main/resources/application.yml`
- `frontend/src/pages/client/pay-order-page.tsx`
- `.env` (backend credentials)
- `frontend/.env.local` (frontend credentials)

## References

- [MercadoPago 500 Diagnostic](../../docs/fixes/mercadopago-500-diagnostic.md)
- [MercadoPago Cookie and 500 Error Fix](../../docs/fixes/mercadopago-cookie-and-500-error-fix.md)
- [MercadoPago Setup Guide](../../MERCADOPAGO_SETUP.md)
- [Test Cards Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
