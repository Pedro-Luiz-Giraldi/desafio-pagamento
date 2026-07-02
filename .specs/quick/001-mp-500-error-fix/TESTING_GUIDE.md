# Testing Guide: MercadoPago Payment Flow

## Quick Test - Copy & Paste Values

### ✅ Test Card (Approved Payment)

Copy these values into your payment form:

```
Nome no Cartão:  APRO
Número do Cartão: 5031 4332 1540 6351
Validade:        11/25
CVV:             123
Parcelas:        1x (or any)
```

**Expected Result:** ✅ Payment approved, transaction created

---

### ❌ Test Card (Declined Payment)

Copy these values to test error handling:

```
Nome no Cartão:  TEST
Número do Cartão: 5031 7557 3453 0604
Validade:        11/25
CVV:             123
Parcelas:        1x
```

**Expected Result:** ❌ Payment declined, error message shown

---

## Step-by-Step Testing

### 1. Open Payment Page

Navigate to an order with status `PENDING` and click "Pagar"

### 2. Fill Form

**Nome no Cartão (Cardholder Name):**
- Type: `APRO`
- This is just a test value - any name works
- "APRO" is MercadoPago's convention for approved test payments

**Número do Cartão (Card Number):**
- Type: `5031 4332 1540 6351`
- The form will auto-format it with spaces
- Brand (Mastercard) will be detected automatically

**Validade (Expiry):**
- Type: `1125` or `11/25`
- Format: MM/YY
- Any future date works

**CVV:**
- Type: `123`
- Any 3-digit number works in test mode

**Parcelas (Installments):**
- Select: `1x` (or any option)
- All installment options work in test mode

### 3. Submit Payment

Click "Pagar R$ XX.XX" button

### 4. Watch Logs (Optional)

In a separate terminal:

```bash
wsl docker logs acabou-o-mony-payment-service-1 --tail 100 -f
```

**Look for:**
```
✅ Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=test_user_123@testuser.com, tokenLength=45
✅ Sending payment request to Mercado Pago...
✅ MP payment created in 234ms: id=123456789, status=approved
✅ Transaction txn_abc123 approved in 456ms
```

### 5. Verify Success

**Frontend:**
- Should show: "Pagamento aprovado!"
- Redirects to order detail page
- Order status changes to "PAID"

**Backend:**
- Transaction record created in database
- Kafka event published
- Notification sent (if configured)

---

## Common Questions

### Q: Where do I get the card information?

**A:** These are **test cards provided by MercadoPago**. You don't need to get them from anywhere - just use the numbers above. They're standardized test cards that work for all developers.

### Q: What should I put in "Nome no Cartão"?

**A:** For approved payments, use **"APRO"** (MercadoPago's convention). But actually, **any name works** - it's just a text field. In test mode, MercadoPago doesn't validate the cardholder name.

Examples that all work:
- `APRO` (recommended)
- `Test User`
- `John Doe`
- `Maria Silva`
- `123` (even numbers work!)

### Q: Do I need a real credit card?

**A:** **No!** Never use real credit calways use the test cards provided by MercadoPago. rds in test mode. AReal cards won't work with test credentials anyway.

### Q: Can I use any CVV?

**A:** Yes, in test mode any 3-digit number works. Common choices:
- `123` (most common)
- `111`
- `999`
- Any 3 digits

### Q: Can I use any expiry date?

**A:** Yes, any **future date** works. Common choices:
- `11/25`
- `12/25`
- `01/30`
- Just make sure it's not expired (month/year in the past)

### Q: How many times can I use the same card?

**A:** **Unlimited!** Test cards can be reused as many times as you want. Each payment generates a new token, so there's no limit.

### Q: What if the payment fails?

**A:** Check the logs for the specific error:

**Error: "Invalid card_token_id"**
- Token expired (took too long to submit)
- Solution: Refresh page and try again

**Error: "MP_SERVER_ERROR" (500)**
- This is what we just fixed!
- If still happening, check the logs for details

**Error: "CARD_DECLINED"**
- You used a declined test card (intentional)
- Or there's an issue with the card token generation

---

## Testing Different Scenarios

### Scenario 1: Approved Payment ✅

**Card:** 5031 4332 1540 6351  
**Expected:** Payment succeeds, order marked as PAID

### Scenario 2: Declined Payment ❌

**Card:** 5031 7557 3453 0604  
**Expected:** Payment fails, error message shown, order stays PENDING

### Scenario 3: Installments

**Card:** 5031 4332 1540 6351  
**Installments:** 3x, 6x, 12x  
**Expected:** Payment succeeds with selected installments

### Scenario 4: Different Brands

**Mastercard:** 5031 4332 1540 6351  
**Visa:** 4235 6477 2802 5682  
**Amex:** 3753 651535 56885  
**Expected:** All should work (brand auto-detected)

---

## Troubleshooting

### Issue: Form shows blank

**Cause:** MercadoPago SDK not loaded

**Check:**
1. Open browser DevTools → Console
2. Look for errors loading SDK
3. Check if `VITE_MP_PUBLIC_KEY` is set

**Solution:**
```bash
# Check public key
wsl bash -c "cat frontend/.env.local | grep VITE_MP_PUBLIC_KEY"

# If missing, add it
echo "VITE_MP_PUBLIC_KEY=TEST-your-public-key-here" >> frontend/.env.local

# Restart frontend
cd frontend && npm run dev
```

### Issue: Payment fails with 500 error

**Cause:** Backend configuration issue (should be fixed now!)

**Check logs:**
```bash
wsl docker logs acabou-o-mony-payment-service-1 --tail 100
```

**Look for:**
- `MP API error: status=500` → Check payer email configuration
- `MP API error: status=400` → Invalid token (frontend issue)
- `MP API error: status=401` → Invalid credentials

### Issue: "Cookie domain" warning in browser

**Cause:** MercadoPago SDK tries to set cookies for mercadopago.com domain

**Impact:** **None!** This is a harmless warning in localhost. Payments still work.

**In production:** This warning won't appear when using a proper domain.

---

## Quick Copy-Paste Values

### Approved Payment
```
APRO
5031 4332 1540 6351
11/25
123
```

### Declined Payment
```
TEST
5031 7557 3453 0604
11/25
123
```

### Visa Card
```
APRO
4235 6477 2802 5682
11/25
123
```

---

## Next Steps After Successful Test

1. ✅ Test with declined card to verify error handling
2. ✅ Test with different installment options
3. ✅ Verify transaction appears in order history
4. ✅ Check if notification email is sent (if configured)
5. ✅ Test webhook handling (if using ngrok)

---

## Need More Test Cards?

📚 **Official MercadoPago Test Cards:**
https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

This page has test cards for:
- Different card brands (Visa, Mastercard, Amex, Elo, etc.)
- Different error scenarios (insufficient funds, invalid CVV, etc.)
- Different countries (Brazil, Argentina, Mexico, etc.)
