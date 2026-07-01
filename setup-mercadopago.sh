#!/bin/bash

# Mercado Pago Setup Script
# This script helps configure Mercado Pago credentials

echo "========================================="
echo "  Mercado Pago Configuration Setup"
echo "========================================="
echo ""

# Check if running in WSL
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in current directory"
    echo "Please run this script from the project root"
    exit 1
fi

echo "📋 Current Mercado Pago configuration:"
echo ""
grep "MERCADOPAGO_ACCESS_TOKEN" .env
echo ""

echo "To configure Mercado Pago:"
echo ""
echo "1. Go to: https://www.mercadopago.com.br/developers/panel"
echo "2. Navigate to 'Suas aplicações' → Select/Create your app"
echo "3. Go to 'Credenciais de teste'"
echo "4. Copy your credentials"
echo ""

read -p "Do you want to update the Access Token now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Mercado Pago Access Token (starts with TEST-): " ACCESS_TOKEN
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo "❌ Access Token cannot be empty"
        exit 1
    fi
    
    # Update .env file
    sed -i "s|MERCADOPAGO_ACCESS_TOKEN='.*'|MERCADOPAGO_ACCESS_TOKEN='$ACCESS_TOKEN'|g" .env
    echo "✅ Access Token updated in .env"
fi

echo ""
echo "📋 Frontend configuration:"
echo ""

if [ -f frontend/.env.local ]; then
    echo "frontend/.env.local exists"
    cat frontend/.env.local
else
    echo "frontend/.env.local does not exist"
fi

echo ""
read -p "Do you want to configure the Frontend Public Key? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Mercado Pago Public Key (starts with TEST-): " PUBLIC_KEY
    
    if [ -z "$PUBLIC_KEY" ]; then
        echo "❌ Public Key cannot be empty"
        exit 1
    fi
    
    # Create or update frontend/.env.local
    echo "VITE_MP_PUBLIC_KEY=$PUBLIC_KEY" > frontend/.env.local
    echo "✅ Public Key configured in frontend/.env.local"
fi

echo ""
echo "========================================="
echo "  Configuration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Restart payment service: docker-compose restart payment-service"
echo "2. Restart frontend: cd frontend && npm run dev"
echo ""
echo "Test cards (Mercado Pago Brazil):"
echo "  Approved: 5031 4332 1540 6351 (master)"
echo "  Declined: 5031 7557 3453 0604 (master)"
echo "  CVV: 123, Expiry: 11/25, Name: Any"
echo ""
echo "More test cards: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards"
echo ""
