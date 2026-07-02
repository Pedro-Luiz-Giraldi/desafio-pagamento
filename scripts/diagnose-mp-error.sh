#!/bin/bash

# MercadoPago 500 Error Diagnostic Script
# This script checks common causes of MP 500 errors

set -e

echo "=========================================="
echo "MercadoPago 500 Error Diagnostic"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Access Token in Environment
echo "1. Checking MERCADOPAGO_ACCESS_TOKEN..."
if docker exec aom-payment-service env | grep -q "MERCADOPAGO_ACCESS_TOKEN"; then
    TOKEN=$(docker exec aom-payment-service env | grep "MERCADOPAGO_ACCESS_TOKEN" | cut -d'=' -f2)
    
    if [[ $TOKEN == TEST-* ]]; then
        MASKED_TOKEN="${TOKEN:0:10}...${TOKEN: -10}"
        echo -e "${GREEN}✅ Token is set: $MASKED_TOKEN${NC}"
        
        # Check token length (should be 60-80 chars)
        TOKEN_LENGTH=${#TOKEN}
        if [ $TOKEN_LENGTH -ge 60 ] && [ $TOKEN_LENGTH -le 80 ]; then
            echo -e "${GREEN}✅ Token length looks valid: $TOKEN_LENGTH characters${NC}"
        else
            echo -e "${YELLOW}⚠️  Token length unusual: $TOKEN_LENGTH characters (expected 60-80)${NC}"
        fi
    else
        echo -e "${RED}❌ Token does not start with TEST- (using production token?)${NC}"
        echo -e "${YELLOW}   Get test token from: https://www.mercadopago.com.br/developers/panel${NC}"
    fi
else
    echo -e "${RED}❌ MERCADOPAGO_ACCESS_TOKEN is not set!${NC}"
    echo -e "${YELLOW}   Add it to .env file and restart payment-service${NC}"
fi
echo ""

# Check 2: Frontend Public Key
echo "2. Checking Frontend Public Key..."
if [ -f "frontend/.env.local" ]; then
    if grep -q "VITE_MP_PUBLIC_KEY" frontend/.env.local; then
        PUBLIC_KEY=$(grep "VITE_MP_PUBLIC_KEY" frontend/.env.local | cut -d'=' -f2)
        if [[ $PUBLIC_KEY == TEST-* ]]; then
            MASKED_KEY="${PUBLIC_KEY:0:10}...${PUBLIC_KEY: -10}"
            echo -e "${GREEN}✅ Public key is set: $MASKED_KEY${NC}"
        else
            echo -e "${RED}❌ Public key does not start with TEST-${NC}"
        fi
    else
        echo -e "${RED}❌ VITE_MP_PUBLIC_KEY not found in frontend/.env.local${NC}"
        echo -e "${YELLOW}   Add: VITE_MP_PUBLIC_KEY=TEST-your-public-key${NC}"
    fi
else
    echo -e "${RED}❌ frontend/.env.local file not found${NC}"
    echo -e "${YELLOW}   Create it with: VITE_MP_PUBLIC_KEY=TEST-your-public-key${NC}"
fi
echo ""

# Check 3: Payment Service Logs
echo "3. Checking Payment Service startup logs..."
if docker logs aom-payment-service 2>&1 | grep -q "MercadoPago SDK configured"; then
    LOG_LINE=$(docker logs aom-payment-service 2>&1 | grep "MercadoPago SDK configured" | tail -1)
    echo -e "${GREEN}✅ SDK initialized: $LOG_LINE${NC}"
else
    echo -e "${YELLOW}⚠️  SDK initialization log not found${NC}"
    echo -e "${YELLOW}   Check if payment-service is running: docker ps | grep payment${NC}"
fi
echo ""

# Check 4: Recent Payment Errors
echo "4. Checking recent payment errors..."
if docker logs aom-payment-service --tail 100 2>&1 | grep -q "MPApiException"; then
    echo -e "${RED}❌ Recent MP API errors found:${NC}"
    docker logs aom-payment-service --tail 100 2>&1 | grep -A 2 "MPApiException" | tail -10
else
    echo -e "${GREEN}✅ No recent MP API errors${NC}"
fi
echo ""

# Check 5: Payer Email Configuration
echo "5. Checking payer email configuration..."
PAYER_EMAIL=$(grep "payer-email:" services/payment-service/src/main/resources/application.yml | awk '{print $2}')
if [[ $PAYER_EMAIL == *"@testuser.com"* ]]; then
    echo -e "${GREEN}✅ Using test user email: $PAYER_EMAIL${NC}"
elif [[ $PAYER_EMAIL == *"guilherme.dias4501@gmail.com"* ]]; then
    echo -e "${YELLOW}⚠️  Using developer account email: $PAYER_EMAIL${NC}"
    echo -e "${YELLOW}   Consider changing to test user email (e.g., test_user_123@testuser.com)${NC}"
else
    echo -e "${YELLOW}⚠️  Payer email: $PAYER_EMAIL${NC}"
fi
echo ""

# Check 6: Payment Service Health
echo "6. Checking payment-service health..."
if docker ps | grep -q "aom-payment-service"; then
    echo -e "${GREEN}✅ Payment service is running${NC}"
    
    # Try to hit health endpoint
    if curl -s http://localhost:8082/actuator/health > /dev/null 2>&1; then
        HEALTH=$(curl -s http://localhost:8082/actuator/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$HEALTH" == "UP" ]; then
            echo -e "${GREEN}✅ Health check: UP${NC}"
        else
            echo -e "${YELLOW}⚠️  Health check: $HEALTH${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not reach health endpoint${NC}"
    fi
else
    echo -e "${RED}❌ Payment service is not running!${NC}"
    echo -e "${YELLOW}   Start it with: docker-compose up -d payment-service${NC}"
fi
echo ""

# Summary and Recommendations
echo "=========================================="
echo "Summary and Recommendations"
echo "=========================================="
echo ""

# Determine most likely issue
ISSUE_FOUND=false

if ! docker exec aom-payment-service env 2>/dev/null | grep -q "MERCADOPAGO_ACCESS_TOKEN"; then
    echo -e "${RED}🔴 CRITICAL: Access token not set${NC}"
    echo "   1. Get test token from: https://www.mercadopago.com.br/developers/panel"
    echo "   2. Add to .env: MERCADOPAGO_ACCESS_TOKEN=TEST-your-token"
    echo "   3. Restart: docker-compose restart payment-service"
    ISSUE_FOUND=true
fi

if [ ! -f "frontend/.env.local" ] || ! grep -q "VITE_MP_PUBLIC_KEY" frontend/.env.local 2>/dev/null; then
    echo -e "${RED}🔴 CRITICAL: Frontend public key not set${NC}"
    echo "   1. Get public key from: https://www.mercadopago.com.br/developers/panel"
    echo "   2. Create frontend/.env.local with: VITE_MP_PUBLIC_KEY=TEST-your-key"
    echo "   3. Restart frontend: cd frontend && npm run dev"
    ISSUE_FOUND=true
fi

if [[ $PAYER_EMAIL == *"guilherme.dias4501@gmail.com"* ]]; then
    echo -e "${YELLOW}⚠️  RECOMMENDED: Update payer email${NC}"
    echo "   1. Edit services/payment-service/src/main/resources/application.yml"
    echo "   2. Change payer-email to: test_user_123@testuser.com"
    echo "   3. Restart: docker-compose restart payment-service"
fi

if [ "$ISSUE_FOUND" = false ]; then
    echo -e "${GREEN}✅ Configuration looks good!${NC}"
    echo ""
    echo "If you're still getting 500 errors, try:"
    echo "1. Test MP API directly (see TASK.md Step 3)"
    echo "2. Check MP service status: https://status.mercadopago.com/"
    echo "3. Verify test card: 5031 4332 1540 6351"
    echo "4. Check browser console for frontend errors"
fi

echo ""
echo "For detailed troubleshooting, see:"
echo "  - .specs/quick/001-mp-500-error-fix/TASK.md"
echo "  - docs/fixes/mercadopago-500-diagnostic.md"
echo ""
