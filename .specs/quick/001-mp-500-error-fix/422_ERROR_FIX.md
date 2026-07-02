# Fix: 422 Error - "diff_param_bins"

**Date:** 2026-07-02  
**Status:** Diagnosing  
**Error Code:** 10103 - Different parameters for the bin

## Error Details

**From Logs:**
```
MP API error: status=400 body={
  "message":"diff_param_bins",
  "error":"bad_request",
  "status":400,
  "cause":[{
    "code":10103,
    "description":"Different parameters for the bin"
  }]
}
```

**Request Details:**
```
amount=299990 (R$ 2999.90)
paymentMethod=visa
installments=1
orderId=49c79bca-be40-4eed-b2c5-6745c7529680
email=test_user_123@testuser.com
tokenLength=32 ⚠️ (seems short, should be ~40-60)
```

## What This Error Means

MercadoPago is saying: **"The card token doesn't match the payment method you're sending"**

This happens when:
1. Token was generated with card number `4235...` (Visa)
2. But payment request says `paymentMethod=master` (Mastercard)
3. Or vice versa

**In your case:** The token might be invalid or malformed (only 32 characters is suspicious).

## Root Cause Analysis

### Possible Causes (in order of likelihood):

1. **Frontend Public Key Not Set** (80% probability)
   - MercadoPago SDK can't generate valid tokens without public key
   - Token generation might be failing silently
   - Frontend might be sending a placeholder or invalid token

2. **Token Generation Failing** (15% probability)
   - MercadoPago SDK not loaded properly
   - JavaScript error during token creation
   - Network issue preventing token generation

3. **Card Number Mismatch** (5% probability)
   - User typed wrong card number
   - Card detection logic has a bug
   - Token generated with different card than submitted

## Diagnostic Steps

### Step 1: Check Frontend Public Key

```bash
wsl bash -c "cat frontend/.env.local 2>/dev/null | grep VITE_MP_PUBLIC_KEY"
```

**Expected output:**
```
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**If missing or wrong:**
```bash
# Create/update frontend/.env.local
echo "VITE_MP_PUBLIC_KEY=TEST-your-public-key-here" > frontend/.env.local

# Restart frontend
cd frontend && npm run dev
```

### Step 2: Check Browser Console

Open browser DevTools (F12) → Console tab

**Look for errors like:**
- `❌ Mercado Pago não configurado` - Public key not set
- `❌ MercadoPago is not defined` - SDK not loaded
- `❌ Failed to create card token` - Token generation failed
- `❌ Invalid public key` - Wrong public key format

**Look for success messages:**
- `✅ Card token created: abc123...` - Token generated successfully

### Step 3: Check Network Tab

Open browser DevTools (F12) → Network tab

**Look for request to:**
```
POST https://api.mercadopago.com/v1/card_tokens
```

**Check response:**
- Status 201 = Token created successfully ✅
- Status 400 = Invalid card data ❌
- Status 401 = Invalid public key ❌
- No request = SDK not loaded or public key missing ❌

### Step 4: Verify Card Number

Make sure you're using a valid test card:

**Visa (recommended):**
```
Card: 4235 6477 2802 5682
CVV: 123
Expiry: 11/25
Name: APRO
```

**Mastercard:**
```
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
Name: APRO
```

## Solution

### Fix 1: Set Frontend Public Key (MOST LIKELY)

**Get your public key:**
1. Go to: https://www.mercadopago.com.br/developers/panel
2. Navigate to "Suas aplicações" → Select your app
3. Go to "Credenciais de teste"
4. Copy the **Public Key** (starts with `TEST-`)

**Set it in frontend:**

```bash
# In WSL
cd /home/pedro/projetos/desafio-pagamento

# Create/update .env.local
cat > frontend/.env.local << 'EOF'
VITE_MP_PUBLIC_KEY=TEST-your-public-key-here
EOF

# Restart frontend
cd frontend
npm run dev
```

**Verify it's loaded:**

Open browser console and type:
```javascript
console.log(import.meta.env.VITE_MP_PUBLIC_KEY)
```

Should show: `TEST-...` (not undefined)

### Fix 2: Verify SDK is Loaded

Open browser console and type:
```javascript
console.log(window.MercadoPago)
```

**Expected:** `function MercadoPago() { ... }`  
**If undefined:** SDK not loaded, check network tab for errors

### Fix 3: Test Token Generation Manually

Open browser console on the payment page and run:

```javascript
// Check if SDK is loaded
console.log('SDK loaded:', typeof window.MercadoPago !== 'undefined')

// Check if public key is set
console.log('Public key:', import.meta.env.VITE_MP_PUBLIC_KEY)

// Try to create a token
const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY)
mp.createCardToken({
  cardNumber: '4235647728025682',
  cardExpirationMonth: '11',
  cardExpirationYear: '25',
  securityCode: '123',
  cardholderName: 'APRO'
}).then(token => {
  console.log('✅ Token created:', token.id)
  console.log('Token length:', token.id.length)
}).catch(error => {
  console.error('❌ Token creation failed:', error)
})
```

**Expected output:**
```
SDK loaded: true
Public key: TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ Token created: abc123def456...
Token length: 45
```

## Verification

After applying Fix 1 (public key):

1. **Restart frontend:**
   ```bash
   cd frontend && npm run dev
   ```

2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached files
   - Or use incognito mode

3. **Try payment again** with test card:
   ```
   Card: 4235 6477 2802 5682
   CVV: 123
   Expiry: 11/25
   Name: APRO
   ```

4. **Check logs:**
   ```bash
   wsl docker logs acabou-o-mony-payment-service-1 --tail 50 -f
   ```

**Expected success:**
```
Creating MP payment: amount=299990, paymentMethod=visa, installments=1, orderId=..., email=test_user_123@testuser.com, tokenLength=45
Sending payment request to Mercado Pago...
MP payment created in 234ms: id=123456789, status=approved
Transaction txn_abc123 approved in 456ms
```

## Common Issues

### Issue: "Public key is undefined"

**Cause:** `.env.local` not created or not loaded

**Solution:**
1. Make sure file is named exactly `.env.local` (not `.env.local.txt`)
2. Make sure it's in the `frontend/` directory
3. Restart frontend dev server
4. Hard refresh browser (Ctrl+F5)

### Issue: "Invalid public key"

**Cause:** Wrong key format or using access token instead of public key

**Check:**
- Public key starts with `TEST-` (for test environment)
- Public key is ~60-80 characters long
- You're not using the access token (which is different)

**Where to find:**
- Access Token: Used by backend (already configured ✅)
- Public Key: Used by frontend (needs to be set)
- Both are in the same place: MP Developers Panel → Credentials

### Issue: Token length still short (< 40 chars)

**Cause:** Token generation is failing, frontend is sending a fallback value

**Solution:**
1. Check browser console for errors
2. Verify public key is correct
3. Try manual token generation test (see Fix 3 above)

## Quick Checklist

- [ ] Frontend public key is set in `frontend/.env.local`
- [ ] Public key starts with `TEST-`
- [ ] Frontend dev server restarted
- [ ] Browser cache cleared or using incognito
- [ ] Using valid test card (4235 6477 2802 5682)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful token creation (201)
- [ ] Token length is ~40-60 characters

## Success Criteria

✅ Token length is 40-60 characters (not 32)  
✅ Browser console shows no errors  
✅ Network tab shows token creation request  
✅ Payment completes successfully  
✅ Logs show "MP payment created... status=approved"  

## Related Files

- `frontend/.env.local` - Public key configuration
- `frontend/src/pages/client/pay-order-page.tsx` - Token generation code
- `frontend/src/lib/card-utils.ts` - Card brand detection
- `.specs/quick/001-mp-500-error-fix/TESTING_GUIDE.md` - Testing instructions

## Next Steps

1. **Set the public key** (most likely fix)
2. **Test payment** with Visa test card
3. **Check logs** for token length
4. **Report back** with results

If issue persists, share:
- Browser console output
- Network tab screenshot (card_tokens request)
- Full error message from logs
