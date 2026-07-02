# Fix: Mercado Pago Cookie Domain Error and 500 Internal Server Error

## Problem

When a CLIENT user tries to make a payment, the following errors occur:

### Frontend Error
```
Cookie "x-meli-session-id" has been rejected for invalid domain
XHR POST http://localhost:5173/api/v1/transactions [HTTP/1.1 500 Internal Server Error 4593ms]
Payment error: AxiosError: Request failed with status code 500
```

### Backend Logs (Grafana)
```
2026-07-02 11:45:53.326 error MP server error - this may indicate: invalid access token, malformed request, or MP service issue
2026-07-02 11:45:53.325 error MP API response headers: {...}
2026-07-02 11:45:53.325 error MP API error: status=500 body={"message":"internal_error","error":null,"status":500,"cause":[]}
2026-07-02 11:45:53.324 error MPApiException during payment creation: status=500, message=Api error. Check response for details
```

## Root Causes

### 1. Cookie Domain Error (Frontend)
The Mercado Pago SDK loaded in the browser tries to set cookies for `mercadopago.com` domain, which are rejected in localhost environment. This is a **warning** and doesn't prevent the payment from being processed, but indicates potential configuration issues.

### 2. Mercado Pago 500 Internal Server Error (Backend)
The MP API returns a 500 error, which typically indicates:

#### Most Common Causes:
1. **Invalid or Missing Access Token**
   - Token not set in environment
   - Token format incorrect (should start with `TEST-` for sandbox)
   - Token expired or revoked

2. **Invalid Payer Email**
   - Using developer account email instead of test user email
   - Current config: `payer-email: guilherme.dias4501@gmail.com` (developer account)
   - Should use: test user email like `test_user_123@testuser.com`

3. **Missing Frontend Public Key**
   - Frontend needs `VITE_MP_PUBLIC_KEY` to generate card tokens
   - Without it, invalid tokens may be sent to backend

4. **Invalid Card Token**
   - Token generated incorrectly
   - Token expired before reaching backend

## Solutions

### Step 1: Verify Mercado Pago Access Token

Check if the access token is properly configured:

```bash
# Check if token is set in docker
docker exec aom-payment-service env | grep MERCADOPAGO_ACCESS_TOKEN

# Should output something like:
# MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef...
```

**If token is missing or incorrect:**

1. Go to https://www.mercadopago.com.br/developers/panel
2. Navigate to "Suas aplicações" → Select your app (or create one)
3. Go to "Credenciais de teste"
4. Copy the **Access Token** (starts with `TEST-`)
5. Update `.env` file:

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-your-actual-token-here
```

6. Restart payment-service:

```bash
docker-compose restart payment-service
```

### Step 2: Configure Frontend Public Key

The frontend needs the Mercado Pago Public Key to generate card tokens.

**Create `frontend/.env.local` file:**

```bash
VITE_MP_PUBLIC_KEY=TEST-your-public-key-here
```

**Where to get the Public Key:**
- Same place as Access Token (Mercado Pago Developers Panel)
- Copy the **Public Key** (starts with `TEST-`)

**Restart frontend:**

```bash
cd frontend
npm run dev
```

### Step 3: Fix Payer Email Configuration

The current configuration uses the developer account email, which may cause issues in the test environment.

**Option A: Use Test User Email (Recommended)**

1. Create a test user at: https://www.mercadopago.com.br/developers/panel/test-users
2. Use the test user's email in the configuration

**Option B: Use Generic Test Email**

Update `services/payment-service/src/main/resources/application.yml`:

```yaml
mercadopago:
  access-token: ${MERCADOPAGO_ACCESS_TOKEN}
  webhook-secret: ${MERCADOPAGO_WEBHOOK_SECRET:}
  notification-url: ${MERCADOPAGO_NOTIFICATION_URL:}
  payer-email: test_user_123@testuser.com  # Use test email instead
  timeout-ms: 800
```

**Restart payment-service after changes:**

```bash
docker-compose restart payment-service
```

### Step 4: Verify Card Token Generation

The frontend code in `pay-order-page.tsx` generates card tokens using the Mercado Pago SDK. Ensure:

1. The SDK is loaded correctly
2. The public key is valid
3. Card data is properly formatted

**Check browser console for errors:**
- Open DevTools → Console
- Look for Mercado Pago SDK errors
- Verify the SDK is loaded: `window.MercadoPago` should be defined

### Step 5: Test with Valid Test Cards

Use Mercado Pago's official test cards:

**Approved Payment:**
- **Card**: 5031 4332 1540 6351
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: APRO (or any name)
- **Brand**: Mastercard (auto-detected)

**Declined Payment:**
- **Card**: 5031 7557 3453 0604
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: Any name
- **Brand**: Mastercard (auto-detected)

More test cards: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## Verification Steps

### 1. Check Payment Service Logs

```bash
docker logs aom-payment-service --tail 100 -f
```

**Expected output on startup:**
```
MercadoPago SDK configured with access token: TEST-1234...5678
```

**Expected output on payment attempt:**
```
Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=test@testuser.com
Setting notification URL: https://...
Sending payment request to Mercado Pago...
MP payment created in 234ms: id=123456789, status=approved
Transaction txn_abc123 approved in 456ms
```

### 2. Check Frontend Environment

```bash
# In frontend directory
cat .env.local

# Should show:
# VITE_MP_PUBLIC_KEY=TEST-...
```

### 3. Test MP API Directly (Optional)

Test if your credentials work directly with Mercado Pago API:

```bash
curl -X POST \
  'https://api.mercadopago.com/v1/payments' \
  -H 'Authorization: Bearer TEST-YOUR-ACCESS-TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_amount": 100,
    "token": "test_token_12345",
    "description": "Test Payment",
    "installments": 1,
    "payment_method_id": "visa",
    "payer": {
      "email": "test@testuser.com"
    }
  }'
```

**Expected response:**
- Status 201 (Created) = Success
- Status 400/422 = Invalid data (check token)
- Status 401 = Invalid access token
- Status 500 = Server error (check all parameters)

## Quick Checklist

- [ ] Verify `MERCADOPAGO_ACCESS_TOKEN` is set in `.env` file
- [ ] Confirm token starts with `TEST-` for sandbox
- [ ] Check token is valid (not expired/revoked) in MP dashboard
- [ ] Create `frontend/.env.local` with `VITE_MP_PUBLIC_KEY`
- [ ] Verify public key starts with `TEST-`
- [ ] Update payer email to test user email (optional but recommended)
- [ ] Restart payment-service: `docker-compose restart payment-service`
- [ ] Restart frontend: `cd frontend && npm run dev`
- [ ] Check payment-service logs for startup confirmation
- [ ] Test with valid test card (5031 4332 1540 6351)
- [ ] Check browser console for SDK errors

## Common Issues and Solutions

### Issue: "MERCADOPAGO_ACCESS_TOKEN is not set!"
**Solution:** Add the token to `.env` file and restart payment-service

### Issue: "Access token does not start with TEST-"
**Solution:** You're using a production token. Get the test token from MP dashboard

### Issue: "MP gateway timeout"
**Solution:** Check network connectivity, MP service status, or increase timeout in application.yml

### Issue: "CARD_DECLINED"
**Solution:** Use a valid test card from MP documentation

### Issue: "MP_SERVER_ERROR" (500)
**Solution:** 
1. Verify access token is valid
2. Check payer email format
3. Ensure card token is valid
4. Check MP service status

### Issue: Cookie domain warning in browser
**Solution:** This is expected in localhost. In production with proper domain, cookies will work correctly. The warning doesn't prevent payments.

## Related Files

- `services/payment-service/src/main/java/com/acaboumony/payment/config/MercadoPagoSdkConfig.java`
- `services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java`
- `services/payment-service/src/main/resources/application.yml`
- `frontend/src/pages/client/pay-order-page.tsx`
- `.env` (backend environment variables)
- `frontend/.env.local` (frontend environment variables)

## Additional Resources

- [Mercado Pago Developers Panel](https://www.mercadopago.com.br/developers/panel)
- [Test Cards Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
- [Checkout API Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing)
- [Test Users Guide](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-users)

## Date

2026-07-02
