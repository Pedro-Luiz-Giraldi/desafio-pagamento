# Browser Debugging Guide

## Quick Diagnostic - Run in Browser Console

Open the payment page, then open browser console (F12) and run these commands:

### 1. Check if MercadoPago SDK is loaded

```javascript
console.log('MercadoPago SDK:', typeof window.MercadoPago !== 'undefined' ? '✅ Loaded' : '❌ Not loaded')
```

**Expected:** `MercadoPago SDK: ✅ Loaded`

---

### 2. Check if Public Key is set

```javascript
console.log('Public Key:', import.meta.env.VITE_MP_PUBLIC_KEY || '❌ Not set')
```

**Expected:** `Public Key: TEST-5a4ebd74-d052-468a-9e95-e8df51636e0e`

---

### 3. Test Token Generation

```javascript
async function testTokenGeneration() {
  try {
    console.log('🔄 Testing token generation...')
    
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY
    if (!publicKey) {
      console.error('❌ Public key not set')
      return
    }
    
    console.log('Public key:', publicKey)
    
    const mp = new window.MercadoPago(publicKey)
    console.log('✅ MercadoPago instance created')
    
    const token = await mp.createCardToken({
      cardNumber: '4235647728025682',
      cardExpirationMonth: '11',
      cardExpirationYear: '25',
      securityCode: '123',
      cardholderName: 'APRO'
    })
    
    console.log('✅ Token created successfully!')
    console.log('Token ID:', token.id)
    console.log('Token length:', token.id.length, token.id.length >= 40 ? '✅' : '⚠️ Too short')
    console.log('Full token object:', token)
    
    return token
  } catch (error) {
    console.error('❌ Token generation failed:', error)
    console.error('Error details:', error.message, error.cause)
  }
}

testTokenGeneration()
```

**Expected output:**
```
🔄 Testing token generation...
Public key: TEST-5a4ebd74-d052-468a-9e95-e8df51636e0e
✅ MercadoPago instance created
✅ Token created successfully!
Token ID: abc123def456ghi789jkl012mno345pqr678stu901
Token length: 45 ✅
Full token object: {id: "abc123...", ...}
```

---

### 4. Check Network Requests

Open Network tab (F12 → Network), then try to make a payment.

**Look for:**

1. **Request to `api.mercadopago.com/v1/card_tokens`**
   - Method: POST
   - Status: 201 (success) or 400 (error)
   - Response should contain `{ "id": "token_here" }`

2. **Request to `/api/v1/transactions`**
   - Method: POST
   - Status: Should be 200 (success) after token fix
   - Request payload should show the token

---

## Common Issues and Solutions

### Issue 1: "MercadoPago is not defined"

**Cause:** SDK script not loaded

**Check:**
1. View page source (Ctrl+U)
2. Look for: `<script src="https://sdk.mercadopago.com/js/v2"></script>`
3. If missing, the SDK didn't load

**Solution:**
- Refresh the page
- Check browser console for script loading errors
- Check if you have ad blockers blocking the SDK

---

### Issue 2: "Public key is undefined"

**Cause:** Environment variable not loaded

**Solution:**
```bash
# Make sure .env.local exists
wsl bash -c "ls -la frontend/.env.local"

# Check content
wsl bash -c "cat frontend/.env.local"

# Should show:
# VITE_MP_PUBLIC_KEY='TEST-5a4ebd74-d052-468a-9e95-e8df51636e0e'

# Restart frontend
cd frontend && npm run dev
```

---

### Issue 3: Token generation fails with error

**Possible errors:**

**"Invalid public key"**
- Public key format is wrong
- Using access token instead of public key
- Key has extra quotes or spaces

**"Invalid card number"**
- Card number has letters or special chars
- Card number is too short/long
- Using real card instead of test card

**"Network error"**
- Firewall blocking api.mercadopago.com
- Ad blocker interfering
- CORS issue (shouldn't happen with MP SDK)

---

### Issue 4: Token is too short (< 40 chars)

**Cause:** Token generation is failing silently, frontend is using a fallback value

**Check:**
1. Run the test token generation script above
2. Check browser console for errors
3. Check network tab for failed requests

**Solution:**
- Fix the public key configuration
- Check for JavaScript errors
- Verify SDK is loaded correctly

---

## What to Report Back

After running the diagnostics, please share:

1. **Output of test token generation:**
   ```
   Copy the entire console output from step 3
   ```

2. **Network tab screenshot:**
   - Show the `card_tokens` request
   - Show the request/response details

3. **Any errors in console:**
   ```
   Copy any red error messages
   ```

4. **Current behavior:**
   - Does payment still fail with 422?
   - Any new error messages?

---

## Quick Fix Attempts

### Try 1: Remove quotes from public key

```bash
# Update .env.local without quotes
wsl bash -c "echo 'VITE_MP_PUBLIC_KEY=TEST-5a4ebd74-d052-468a-9e95-e8df51636e0e' > frontend/.env.local"

# Restart frontend
cd frontend && npm run dev
```

Then refresh browser and try again.

---

### Try 2: Hard refresh browser

1. Close all browser tabs with your app
2. Clear browser cache (Ctrl+Shift+Delete)
3. Open in incognito/private mode
4. Try payment again

---

### Try 3: Check if SDK is blocked

1. Open browser console
2. Go to Network tab
3. Filter by "mercadopago"
4. Refresh page
5. Look for `sdk.mercadopago.com/js/v2`
   - Status 200 = ✅ Loaded
   - Status 0 or failed = ❌ Blocked

If blocked:
- Disable ad blockers
- Check firewall settings
- Try different browser

---

## Expected Working Flow

When everything is working correctly:

1. **Page loads:**
   ```
   ✅ MercadoPago SDK loaded
   ✅ Public key available
   ```

2. **User fills form and submits:**
   ```
   ✅ Token generation starts
   ✅ POST to api.mercadopago.com/v1/card_tokens
   ✅ Response: { "id": "45-char-token" }
   ```

3. **Frontend sends payment request:**
   ```
   ✅ POST to /api/v1/transactions
   ✅ Payload includes valid token
   ```

4. **Backend processes:**
   ```
   ✅ Token length: 45 characters
   ✅ MP payment created: status=approved
   ✅ Transaction saved
   ```

5. **User sees:**
   ```
   ✅ "Pagamento aprovado!"
   ✅ Redirect to order page
   ```

---

## Next Steps

1. **Run the diagnostic scripts above**
2. **Share the output** (especially the token generation test)
3. **Try the quick fixes** if you see obvious issues
4. **Report back** with results

This will help us pinpoint exactly where the token generation is failing!
