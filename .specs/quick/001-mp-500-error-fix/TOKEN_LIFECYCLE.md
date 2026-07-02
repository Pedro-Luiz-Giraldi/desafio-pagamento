# MercadoPago Token Lifecycle

## How Card Tokens Work

### 1. Token Generation (Frontend)

When a user enters card information in your frontend, the MercadoPago SDK generates a **card token**:

```javascript
// In pay-order-page.tsx
const mp = new window.MercadoPago(publicKey)

const cardToken = await mp.createCardToken({
  cardNumber: '5031433215406351',
  cardExpirationMonth: '11',
  cardExpirationYear: '25',
  securityCode: '123',
  cardholderName: 'APRO',
})

// cardToken.id = "abc123def456..." (this is what gets sent to backend)
```

### 2. Token Characteristics

**Format:**
- Random alphanumeric string
- Length: ~40-60 characters
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Security:**
- Token is **single-use** - can only be used once
- Token **expires quickly** - typically 5-15 minutes
- Token **doesn't contain** actual card data (PCI compliant)
- Token is **specific to your account** - can't be used elsewhere

### 3. Token Expiration

⏱️ **Expiration Time: ~5-15 minutes**

**What happens when token expires:**
```
MP API error: status=400 body={"message":"Invalid card_token_id",...}
```

**Common scenarios:**
- ✅ User fills form and submits immediately → Token valid
- ❌ User fills form, waits 10 minutes, then submits → Token expired
- ❌ User refreshes page after token generation → Token lost
- ❌ Backend retries payment with same token → Token already used

### 4. Token Flow in Your App

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. User enters card data
       │
       ▼
┌─────────────────────┐
│  MercadoPago SDK    │
│  (JavaScript)       │
└──────┬──────────────┘
       │ 2. Generate token
       │    POST https://api.mercadopago.com/v1/card_tokens
       │    (uses PUBLIC_KEY)
       │
       ▼
┌─────────────────────┐
│  MercadoPago API    │
└──────┬──────────────┘
       │ 3. Returns token
       │    { id: "abc123..." }
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Payment   │
│   Service)  │
└──────┬──────┘
       │ 4. Create payment
       │    POST https://api.mercadopago.com/v1/payments
       │    (uses ACCESS_TOKEN + card token)
       │
       ▼
┌─────────────────────┐
│  MercadoPago API    │
└──────┬──────────────┘
       │ 5. Process payment
       │    Returns: approved/declined
       │
       ▼
┌─────────────┐
│  Database   │
│ (Transaction│
│   Record)   │
└─────────────┘
```

## Token Best Practices

### ✅ DO

1. **Generate token immediately before payment**
   ```javascript
   // Good: Generate and use immediately
   const token = await mp.createCardToken(cardData)
   await processPayment({ cardToken: token.id })
   ```

2. **Handle token expiration gracefully**
   ```javascript
   try {
     await processPayment({ cardToken: token.id })
   } catch (error) {
     if (error.code === 'INVALID_CARD_TOKEN') {
       // Regenerate token and retry
       const newToken = await mp.createCardToken(cardData)
       await processPayment({ cardToken: newToken.id })
     }
   }
   ```

3. **Use idempotency keys for retries**
   ```javascript
   // Your app already does this correctly
   const idempotencyKey = uuidv4()
   await processPayment({ cardToken, idempotencyKey })
   ```

### ❌ DON'T

1. **Don't store tokens for later use**
   ```javascript
   // Bad: Token will expire
   const token = await mp.createCardToken(cardData)
   localStorage.setItem('cardToken', token.id) // ❌ Don't do this
   
   // Later...
   const oldToken = localStorage.getItem('cardToken')
   await processPayment({ cardToken: oldToken }) // ❌ Will fail
   ```

2. **Don't reuse tokens**
   ```javascript
   // Bad: Token is single-use
   const token = await mp.createCardToken(cardData)
   await processPayment({ cardToken: token.id }) // ✅ First use OK
   await processPayment({ cardToken: token.id }) // ❌ Second use fails
   ```

3. **Don't send card data to backend**
   ```javascript
   // Bad: PCI compliance violation
   await processPayment({
     cardNumber: '5031433215406351', // ❌ Never send raw card data
     cvv: '123',                      // ❌ to your backend
   })
   
   // Good: Only send token
   await processPayment({
     cardToken: token.id // ✅ Token is safe to send
   })
   ```

## Troubleshooting Token Issues

### Error: "Invalid card_token_id"

**Cause:** Token expired or already used

**Solution:**
1. Check how long between token generation and payment
2. Ensure token is generated fresh for each payment attempt
3. Don't retry with the same token

**Your app's current implementation:**
```typescript
// frontend/src/pages/client/pay-order-page.tsx
async function handleSubmit(e: React.FormEvent) {
  // ✅ Good: Token generated fresh on each submit
  const cardToken = await mp.createCardToken({...})
  
  // ✅ Good: Idempotency key for safe retries
  const paymentResult = await processPayment.mutateAsync({
    cardToken: cardToken.id,
    idempotencyKey: uuidv4(),
  })
}
```

### Error: "Mercado Pago não configurado"

**Cause:** Frontend public key not set

**Solution:**
```bash
# Check if public key exists
wsl bash -c "cat frontend/.env.local | grep VITE_MP_PUBLIC_KEY"

# If missing, add it
echo "VITE_MP_PUBLIC_KEY=TEST-your-public-key-here" >> frontend/.env.local

# Restart frontend
cd frontend && npm run dev
```

### Error: Token generation fails silently

**Cause:** MercadoPago SDK not loaded or public key invalid

**Solution:**
1. Open browser DevTools → Console
2. Check for errors like:
   - `MercadoPago is not defined`
   - `Invalid public key`
   - `Failed to load SDK`

3. Verify SDK is loaded:
   ```javascript
   console.log(window.MercadoPago) // Should show function
   ```

## Token Security

### Why Tokens Are Secure

1. **No card data in token**
   - Token is just a reference ID
   - Actual card data stays with MercadoPago
   - Your backend never sees card numbers

2. **Single-use**
   - Can't be reused for multiple payments
   - Prevents replay attacks

3. **Short-lived**
   - Expires in minutes
   - Reduces window for token theft

4. **Account-specific**
   - Token only works with your MercadoPago account
   - Can't be used by other merchants

### PCI Compliance

By using tokens, your app is **PCI DSS compliant** because:
- ✅ Card data never touches your servers
- ✅ Card data never stored in your database
- ✅ Card data only transmitted to MercadoPago (PCI certified)
- ✅ Your backend only handles tokens (not sensitive data)

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Token Length** | ~40-60 characters |
| **Expiration** | 5-15 minutes |
| **Usage** | Single-use only |
| **Generation** | Frontend (MercadoPago SDK) |
| **Requires** | Public Key (TEST-...) |
| **Security** | PCI compliant, no card data |
| **Retry** | Generate new token for each retry |
| **Storage** | Never store tokens |

## Related Documentation

- [MercadoPago Card Tokens API](https://www.mercadopago.com.br/developers/pt/reference/cards/_card_tokens/post)
- [Test Cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
- [Frontend Implementation](../../../frontend/src/pages/client/pay-order-page.tsx)
- [Backend Implementation](../../../services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java)
