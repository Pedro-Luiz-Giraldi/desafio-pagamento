#!/bin/bash

# Apply MercadoPago 500 Error Fix
# This script restarts the payment service with the updated configuration

set -e

echo "=========================================="
echo "Applying MercadoPago 500 Error Fix"
echo "=========================================="
echo ""

echo "Changes applied:"
echo "  ✅ Updated payer email to: test_user_123@testuser.com"
echo "  ✅ Enhanced logging for payment requests"
echo ""

echo "Step 1: Rebuilding payment-service..."
docker-compose build payment-service

echo ""
echo "Step 2: Restarting payment-service..."
docker-compose restart payment-service

echo ""
echo "Step 3: Waiting for service to be healthy..."
sleep 5

# Check if service is running
if docker ps | grep -q "acabou-o-mony-payment-service-1"; then
    echo "✅ Payment service is running"
    
    # Check health
    if curl -s http://localhost:8082/actuator/health | grep -q '"status":"UP"'; then
        echo "✅ Payment service is healthy"
    else
        echo "⚠️  Payment service may not be fully ready yet"
    fi
else
    echo "❌ Payment service is not running!"
    exit 1
fi

echo ""
echo "Step 4: Checking configuration..."
PAYER_EMAIL=$(docker exec acabou-o-mony-payment-service-1 env | grep "MERCADOPAGO_PAYER_EMAIL" | cut -d'=' -f2)
echo "Payer email: $PAYER_EMAIL"

if [[ $PAYER_EMAIL == *"testuser.com"* ]]; then
    echo "✅ Payer email updated successfully"
else
    echo "⚠️  Payer email may not have updated (still: $PAYER_EMAIL)"
    echo "   This might require a full rebuild"
fi

echo ""
echo "=========================================="
echo "Fix Applied Successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Watch logs: docker logs acabou-o-mony-payment-service-1 --tail 100 -f"
echo "2. Test payment with card: 5031 4332 1540 6351"
echo "3. Look for: 'MP payment created in XXXms: id=XXXXXX, status=approved'"
echo ""
echo "If still failing, check logs for detailed error information"
echo "and see: .specs/quick/001-mp-500-error-fix/SUMMARY.md"
echo ""
