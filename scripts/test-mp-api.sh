#!/bin/bash

# Test MercadoPago API directly with current credentials

set -e

echo "Testing MercadoPago API with current credentials..."
echo ""

# Get token from container
TOKEN=$(docker exec acabou-o-mony-payment-service-1 env | grep "MERCADOPAGO_ACCESS_TOKEN" | cut -d'=' -f2)

if [ -z "$TOKEN" ]; then
    echo "❌ Could not retrieve access token"
    exit 1
fi

MASKED_TOKEN="${TOKEN:0:10}...${TOKEN: -10}"
echo "Using token: $MASKED_TOKEN"
echo ""

# Test 1: Simple payment request with idempotency key
echo "Test 1: Creating a test payment with proper headers..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  'https://api.mercadopago.com/v1/payments' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: test-diagnostic-12345' \
  -d '{
    "transaction_amount": 100,
    "token": "test_token_12345",
    "description": "Test Payment",
    "installments": 1,
    "payment_method_id": "visa",
    "payer": {
      "email": "test@testuser.com"
    }
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo "Response: $BODY"
echo ""

# Interpret results
case $HTTP_STATUS in
  201)
    echo "✅ SUCCESS: Credentials are valid and payment was created"
    echo "   The 500 error is NOT caused by invalid credentials"
    echo "   Issue is likely:"
    echo "   - Invalid card token from frontend"
    echo "   - Payer email mismatch"
    echo "   - Request payload format"
    ;;
  400|422)
    echo "⚠️  PARTIAL SUCCESS: Credentials work, but request data is invalid"
    echo ""
    if echo "$BODY" | grep -q "token"; then
        echo "   ✅ Token is invalid (expected with test_token_12345)"
        echo "   ✅ Your MercadoPago credentials ARE VALID"
        echo ""
        echo "   The 500 error you're experiencing is likely caused by:"
        echo "   1. Invalid card token from frontend (most likely)"
        echo "   2. Payer email issue"
        echo "   3. Missing required fields in request"
        echo ""
        echo "   Next: Check frontend card token generation"
    else
        echo "   Error details: $BODY"
    fi
    ;;
  401)
    echo "❌ FAILURE: Invalid access token"
    echo "   Get new token from: https://www.mercadopago.com.br/developers/panel"
    ;;
  500)
    echo "❌ FAILURE: MercadoPago server error (same as your issue)"
    echo "   This confirms the issue is with your account or MP service"
    echo ""
    echo "   Possible causes:"
    echo "   1. Token is expired or revoked"
    echo "   2. Account has restrictions or is not activated"
    echo "   3. MercadoPago service issue"
    echo ""
    echo "   Action items:"
    echo "   1. Check MP dashboard: https://www.mercadopago.com.br/developers/panel"
    echo "   2. Verify account status and application status"
    echo "   3. Check MP service status: https://status.mercadopago.com/"
    echo "   4. Try regenerating credentials"
    ;;
  *)
    echo "❓ UNEXPECTED: HTTP $HTTP_STATUS"
    echo "   Response: $BODY"
    ;;
esac

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo ""
echo "Based on the test result:"
echo ""
if [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "422" ]; then
    echo "✅ Your MercadoPago credentials are VALID"
    echo "✅ The API is accessible and responding"
    echo "❌ The 500 error in your app is caused by:"
    echo "   - Invalid card token from frontend"
    echo "   - Payer email configuration"
    echo "   - Request payload format"
    echo ""
    echo "Next steps:"
    echo "1. Check frontend public key is set correctly"
    echo "2. Verify card token generation in browser console"
    echo "3. Check payer email in application.yml"
    echo "4. Review request payload in payment-service logs"
elif [ "$HTTP_STATUS" = "500" ]; then
    echo "❌ MercadoPago is returning 500 even with simple test"
    echo "   This indicates an account or service issue"
    echo ""
    echo "Action required:"
    echo "1. Check your MP account status"
    echo "2. Verify application is activated"
    echo "3. Try regenerating credentials"
    echo "4. Contact MP support if issue persists"
fi
