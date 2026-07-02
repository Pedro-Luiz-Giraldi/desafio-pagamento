# App Context - Debug Pipeline

## Tech Stack
- **Backend**: Spring Boot 3.4.5, Java 21, Maven
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL 16 (per-service databases)
- **Cache**: Redis 7
- **Messaging**: Kafka (Confluent)
- **Payment**: Mercado Pago SDK (SDK-Java 2.1.29)
- **Tests**: JUnit 5, Mockito, WireMock, Testcontainers, JaCoCo (90% coverage min)
- **Frontend tests**: Vitest, Playwright E2E, Testing Library
- **Infrastructure**: Docker Compose (profiles: app, monitoring, observability, k6)

## Project Structure
- `services/` — Backend microservices
  - `api-gateway/` — Spring Cloud Gateway (port 8080)
  - `payment-service/` — Payment processing (port 8082)
  - `user-service/` — User management (port 8081)
  - `order-service/` — Order management (port 8083)
  - `fraud-service/` — Fraud analysis (port 8085)
  - `notification-service/` — Notifications (port 8084)
- `frontend/` — React SPA (Vite, port 5173)

## How to Run
- **Full app**: `docker compose --profile app up --build`
- **Infra only**: `docker compose up`
- **Frontend dev**: `cd frontend && npm run dev`
- **All profiles**: `docker compose --profile app --profile monitoring --profile observability up --build`

## How to Run Tests
- **Backend (payment-service)**: `cd services/payment-service && mvn test`
- **Integration tests**: `mvn verify` (runs failsafe plugin)
- **Frontend**: `cd frontend && npm test` (vitest)
- **Frontend E2E**: `cd frontend && npm run test:e2e`
- JaCoCo minimum coverage: 90%

## Logs
- **Docker**: `docker compose logs payment-service`
- **Backend logs**: stdout via Spring Boot logging
- Payment service logs include detailed MP API call logs

## Debug Surfaces

### API Endpoints
- `POST /api/v1/transactions` — Process a payment
  - Headers: Authorization (Bearer JWT), X-Forwarded-For
  - Body: amountInCents, currency, customerId, orderId, cardToken, paymentMethodId, installments, idempotencyKey
- `GET /api/v1/transactions/{id}` — Get transaction
- `GET /api/v1/transactions` — List transactions
- `POST /api/v1/transactions/{id}/refund` — Refund

### How to Query
- Actuator: `http://localhost:8082/actuator/health`

### Payment Flow
1. Frontend creates card token via Mercado Pago SDK (browser-side)
2. Frontend sends POST to API Gateway (`/api/v1/transactions`)
3. Gateway authenticates JWT, injects X-User-Id, X-User-Email, X-User-Role headers
4. Payment service: validates order (via order-service), validates customer (via user-service), fraud check (via fraud-service), then calls MP API
5. MP responds with approved/rejected
6. Response returned to frontend with HTTP status based on result

### Key Configuration
- `MERCADOPAGO_ACCESS_TOKEN` — Test token in .env
- `MERCADOPAGO_TIMEOUT_MS` — Default 800ms (code), 10000ms (docker)
- `mercadopago.payer-email` — Fixed: test_user_123@testuser.com
- `VITE_MP_PUBLIC_KEY` — Frontend env (needs to match access token)

### Test Cards (Mercado Pago)
- **Approved**: 5031 4332 1540 6351 (master, CVV: 123, Exp: 11/25)
- **Declined**: 5031 7557 3453 0604 (master, CVV: 123, Exp: 11/25)

### Error Code → HTTP Status Mapping
- CARD_DECLINED → 422 UNPROCESSABLE_ENTITY
- MP_GATEWAY_TIMEOUT → 503 SERVICE_UNAVAILABLE
- SUSPECTED_FRAUD → 422 UNPROCESSABLE_ENTITY
- INVALID_CURRENCY, INVALID_CARD_TOKEN → 400 BAD_REQUEST
- DUPLICATE_IDEMPOTENCY_KEY → 409 CONFLICT
- RATE_LIMIT_EXCEEDED → 429 TOO_MANY_REQUESTS
