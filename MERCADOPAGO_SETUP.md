# Mercado Pago Configuration Guide

## Problem
Payment page shows blank with only order header because:
1. Missing Mercado Pago credentials in environment
2. Wrong `paymentMethodId` being sent to API
3. Frontend not configured with Public Key

## Solution

### 1. Configure Backend (Payment Service)

Edit your `.env` file in WSL and replace the placeholder:

```bash
# In WSL, edit .env
nano .env

# Replace this line:
MERCADOPAGO_ACCESS_TOKEN='TEST-CHANGE_ME'

# With your actual Access Token:
MERCADOPAGO_ACCESS_TOKEN='YOUR_ACCESS_TOKEN_HERE'
```

**Where to get your Access Token:**
1. Go to https://www.mercadopago.com.br/developers/panel
2. Navigate to "Suas aplicações" → Select your app (or create one)
3. Go to "Credenciais de teste"
4. Copy the **Access Token** (starts with `TEST-`)

### 2. Configure Frontend

Create or edit `frontend/.env.local` in WSL:

```bash
# In WSL
cd frontend
nano .env.local

# Add this line:
VITE_MP_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

**Where to get your Public Key:**
- Same place as Access Token (step 1 above)
- Copy the **Public Key** (starts with `TEST-`)

### 3. Fix Payment Method ID

The current code sends `paymentMethodId: 'credit_card'` which is invalid.

Mercado Pago requires specific card brand IDs:
- `visa`
- `master` (Mastercard)
- `amex` (American Express)
- `elo`
- `hipercard`

**We need to detect the card brand from the card number.**

### 4. Restart Services

After configuring:

```bash
# In WSL, restart payment service
docker-compose restart payment-service

# Restart frontend dev server
cd frontend
npm run dev
```

## Test Cards (Mercado Pago Brazil)

Use these test cards after configuration:

### Approved Payment
- **Card**: 5031 4332 1540 6351
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: Any name
- **Brand**: `master`

### Declined Payment
- **Card**: 5031 7557 3453 0604
- **CVV**: 123
- **Expiry**: 11/25
- **Name**: Any name
- **Brand**: `master`

### More test cards
https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## Next Steps

After you provide your keys, I will:
1. Update the frontend to detect card brand automatically
2. Fix the payment flow to send correct `paymentMethodId`
3. Ensure proper error handling
