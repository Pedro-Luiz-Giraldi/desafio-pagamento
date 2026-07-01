# PRD: Role Separation — Merchant & Client

## TDD Mode: REQUIRED

Cada task de implementação DEVE seguir o ciclo RED → GREEN → REFACTOR:
1. RED: Escrever teste falhando baseado na spec (cada CE-* = 1 teste mínimo)
2. GREEN: Implementar o mínimo para o teste passar
3. REFACTOR: Melhorar sem quebrar testes

Nomes de testes seguem o padrão: `deve_<comportamento>_quando_<condição>()`
Jamais usar H2 — usar Testcontainers com PostgreSQL real.

## Objetivo

Separate the existing single-user system into two distinct role-based experiences: **Merchant** (existing MERCHANT_OWNER pages preserved) and **Client** (new CUSTOMER experience). No existing merchant functionality is removed or changed.

## Comportamento esperado

- **R4**: Registration creates user with respective role (CUSTOMER / MERCHANT_OWNER)
- **R6**: After login, MERCHANT_OWNER → `/dashboard`, CUSTOMER → `/client/dashboard`
- **R7-R9**: Same layout shell, different navigation per role
- **R17**: Client Dashboard shows orders summary, recent transactions, quick "New Order"
- **R18**: My Orders filtered to own orders only; "Pay" button on PENDING orders
- **R20**: Merchants List shows active merchants
- **R21**: Order Create with merchant selection → product catalog → add items → submit
- **R22**: Payment Page with card form (Mercado Pago tokenization)
- **R23**: After creating an order, auto-redirect to payment page
- **R24**: If payment cancelled/fails, order stays PENDING; client can pay later
- **R25**: Successful payment → redirect to order detail showing PAID status

## Casos de erro

Não documentados explicitamente em tabela. A spec menciona:
- Registration: validation errors for missing/invalid fields
- Payment: Mercado Pago declines, failed payments
- Order: expired orders, failed payment retry
- Authorization: CUSTOMER trying merchant-only routes, X-User-Id mismatch

## Casos extremos

| ID | Questão | Resolução |
|----|---------|-----------|
| CE-001 | Clients can self-register? | Yes |
| CE-002 | Client can have orders with multiple merchants? | Yes |
| CE-003 | How does client select merchant? | From a list of active merchants |
| CE-004 | What orders can merchant see? | All orders for their merchant, all statuses |
| CE-005 | Flow after order creation? | Auto-redirect to payment; can pay later if cancelled |
| CE-006 | What can client see? | Own orders, transactions, payment history, merchant info |
| CE-007 | Clear existing data? | Yes, fresh start |
| CE-008 | Views per role? | Same login, different views after login |
| CE-009 | Product catalog? | Per-merchant catalog, merchant inserts manually via DB |
| CE-010 | In-app payment? | Yes, backend already processes MP; frontend needs card form |

## Restrições técnicas

- Stack: Java 21 + Spring Boot 3.x + PostgreSQL + Redis + Kafka
- DTOs como Records Java 21
- Resultados como sealed interfaces (Success/Failure)
- Virtual Threads para operações de I/O
- Cobertura mínima: 90% (JaCoCo)
- Nunca logar: número de cartão, CVV, senha
- Performance: não especificado (default P50 < 550ms, P99 < 1s)

## Efeitos colaterais esperados

- **Kafka:** Eventos de pagamento (backend já processa fluxo MP + Kafka)
- **Redis:** Cache de sessão (existente)
- **Mercado Pago:** Tokenização de cartão via SDK JS + backend chama MP API

## Segurança

- **Autenticação:** JWT obrigatório (existente)
- **Autorização:** Role-based (MERCHANT_OWNER vs CUSTOMER) para rotas protegidas
- **Dados sensíveis:** Cartão de crédito tokenizado via Mercado Pago JS SDK (nunca chega ao backend como raw)
- **Rate limiting:** Não especificado (default do gateway)
- **Validações críticas:** Impedir impersonation — `customerId` do body deve bater com `X-User-Id` header

## Tasks de Implementação

### Phase 1: Backend Foundation (parallel)
| # | Task | Service | Dependencies |
|---|------|---------|-------------|
| T1 | CUSTOMER registration in user-service | user-service | None |
| T2 | Merchant listing API (GET /api/v1/merchants) | user-service | None |
| T3 | Product entity, migration, and API (GET /api/v1/products) | order-service | None |
| T4 | Gateway routes for /api/v1/products/** and /api/v1/merchants/** | api-gateway | None |
| T5 | Payment transaction authorization (customerId from header) | payment-service | None |

### Phase 2: Frontend Core (parallel)
| # | Task | Dependencies |
|---|------|-------------|
| T6 | Registration page with role toggle | T1 |
| T7 | Login redirect based on role | None |
| T8 | Role-based navigation (AuthenticatedLayout) | None |
| T9 | Role-based route protection (App.tsx) | None |

### Phase 3: Merchant Frontend (parallel)
| # | Task | Dependencies |
|---|------|-------------|
| T10 | Merchant dashboard: remove "New Order" | None |
| T11 | Products list page (read-only, merchant) | T3 |
| T12 | Keep orders/transactions pages as-is | None |

### Phase 4: Client Frontend (parallel)
| # | Task | Dependencies |
|---|------|-------------|
| T13 | Client Dashboard | None |
| T14 | Merchants List page + detail | T2 |
| T15 | Order Create with merchant selection + product catalog | T3, T14 |
| T16 | My Orders list (own orders + Pay button) | None |
| T17 | Payment page (card form + MP tokenization) | T5 |
| T18 | My Transactions list (own transactions) | T5 |
| T19 | Order detail with Pay button for PENDING orders | None |

### Phase 5: Integration & Polish
| # | Task | Dependencies |
|---|------|-------------|
| T20 | Verify redirect flow: create → pay → success/failure | T15, T17 |
| T21 | Verify client can pay later from orders list | T16 |
| T22 | Edge cases: expired orders, failed payment retry | T17 |
| T23 | Clear dev database / fresh seed data | None |
