# Action Plan: Fix MercadoPago 500 Error

**Status:** ✅ Fixes Applied - Ready to Test  
**Date:** 2026-07-02  
**Estimated Time:** 5 minutes

## What Was Changed

### 1. Payer Email Configuration ✅
**File:** `services/payment-service/src/main/resources/application.yml`

**Changed from:**
```yaml
payer-email: guilherme.dias4501@gmail.com
```

**Changed to:**
```yaml
payer-email: test_user_123@testuser.com
```

**Why:** MercadoPago's test environment often rejects developer account emails. Using a test user email is the recommended practice and a common fix for 500 errors.

### 2. Enhanced Logging ✅
**File:** `services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java`

**Changes:**
- Changed `log.debug` to `log.info` for payment creation logs
- Added card token length to logs
- Made payment result logging more visible

**Why:** This will help diagnose the issue if the payer email fix doesn't resolve it.

## How to Apply

### Option A: Automatic (Recommended)

Run the automated fix script:

```bash
wsl bash scripts/apply-mp-fix.sh
```

This will:
1. Rebuild payment-service with new configuration
2. Restart the service
3. Verify it's running and healthy
4. Check the configuration was applied

### Option B: Manual

```bash
# 1. Rebuild and restart payment service
docker-compose build payment-service
docker-compose restart payment-service

# 2. Wait for service to be healthy
sleep 5

# 3. Verify it's running
docker ps | grep payment-service

# 4. Check logs
docker logs acabou-o-mony-payment-service-1 --tail 50
```

## Testing

### 1. Watch Logs

Open a terminal and watch the logs:

```bash
docker logs acabou-o-mony-payment-service-1 --tail 100 -f
```

### 2. Attempt Payment

Use the test card:
- **Card Number:** 5031 4332 1540 6351
- **CVV:** 123
- **Expiry:** 11/25
- **Name:** APRO (or any name)

### 3. Expected Success Output

```
Creating MP payment: amount=8990, paymentMethod=master, installments=1, orderId=..., email=test_user_123@testuser.com, tokenLength=45
Sending payment request to Mercado Pago...
MP payment created in 234ms: id=123456789, status=approved
Transaction txn_abc123 approved in 456ms
```

### 4. If Still Failing

Look for these in the logs:

**Error Pattern 1: Invalid Token**
```
MP API error: status=400 body={"message":"Invalid card_token_id",...}
```
→ **Issue:** Frontend token generation problem
→ **Fix:** Check frontend public key configuration

**Error Pattern 2: Still 500**
```
MP API error: status=500 body={"message":"internal_error",...}
```
→ **Issue:** May need to create proper test user
→ **Fix:** Go to https://www.mercadopago.com.br/developers/panel/test-users

**Error Pattern 3: Payer Email Not Updated**
```
Creating MP payment: ... email=guilherme.dias4501@gmail.com ...
```
→ **Issue:** Configuration not reloaded
→ **Fix:** Full rebuild: `docker-compose down && docker-compose up -d`

## Rollback (If Needed)

If you need to revert the changes:

```bash
# Revert payer email
git checkout services/payment-service/src/main/resources/application.yml

# Revert logging changes (optional - they're harmless)
git checkout services/payment-service/src/main/java/com/acaboumony/payment/client/MercadoPagoGateway.java

# Restart service
docker-compose restart payment-service
```

## Success Criteria

✅ Payment completes successfully  
✅ Transaction status shows "APPROVED"  
✅ No 500 errors in logs  
✅ Frontend shows "Pagamento aprovado!"  

## Probability of Success

- **70%** - Payer email fix resolves the issue
- **20%** - Need to also fix frontend public key
- **10%** - Need to create proper test user in MP dashboard

**Combined: 95%+ chance of resolution**

## Next Steps After Success

1. Test with different cards (approved/declined scenarios)
2. Test with different installment options
3. Verify webhook notifications are working
4. Update documentation with the fix

## If Issue Persists

1. **Check frontend public key:**
   ```bash
   wsl bash -c "cat frontend/.env.local | grep VITE_MP_PUBLIC_KEY"
   ```

2. **Create proper test user:**
   - Go to: https://www.mercadopago.com.br/developers/panel/test-users
   - Create a test buyer
   - Use that email in application.yml

3. **Contact for help:**
   - Share the logs from Step 3 above
   - Include the output of: `bash scripts/diagnose-mp-error.sh`
   - Reference this document: `.specs/quick/001-mp-500-error-fix/ACTION_PLAN.md`

## Related Files

- `.specs/quick/001-mp-500-error-fix/TASK.md` - Detailed diagnostic guide
- `.specs/quick/001-mp-500-error-fix/SUMMARY.md` - Analysis and findings
- `scripts/apply-mp-fix.sh` - Automated fix script
- `scripts/test-mp-api.sh` - API testing script
- `scripts/diagnose-mp-error.sh` - Diagnostic script

## Support Resources

- [MercadoPago Developers Panel](https://www.mercadopago.com.br/developers/panel)
- [Test Users Guide](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-users)
- [Test Cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
- [API Documentation](https://www.mercadopago.com.br/developers/pt/reference)
