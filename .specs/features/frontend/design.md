# Frontend — Design de Arquitetura

**Versão:** 1.0
**Data:** 2026-06-22

---

## 1. Arquitetura da Aplicação

```
┌──────────────────────────────────────────────────────┐
│                     Vite Dev Server                    │
│                   (port 5173 dev)                      │
└──────────────────┬───────────────────────────────────┘
                   │ HTTP
┌──────────────────▼───────────────────────────────────┐
│               api-gateway (port 8080)                  │
│  JWT validation, rate limit, routing, correlation ID  │
└──┬───────────┬───────────┬──────────────────────────┘
   │           │           │
   ▼           ▼           ▼
user-service order-service payment-service
(:8081)       (:8083)      (:8082)
```

**Build:** Vite dev server em desenvolvimento → `vite build` → nginx static serve em produção.

---

## 2. Estrutura de Diretórios

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── Dockerfile
├── nginx.conf
├── package.json
├── .env.example
├── .env
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.tsx                    # Entry point + providers
│   ├── App.tsx                     # Router setup
│   ├── routes.tsx                  # Route definitions
│   ├── index.css                   # Tailwind base imports
│   │
│   ├── api/                        # HTTP layer
│   │   ├── client.ts               # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── orders.api.ts
│   │   ├── transactions.api.ts
│   │   └── users.api.ts
│   │
│   ├── stores/                     # Zustand stores
│   │   └── auth.store.ts           # Auth state (token, user, loading)
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── use-auth.ts
│   │   ├── use-orders.ts           # TanStack Query wrappers
│   │   └── use-transactions.ts
│   │
│   ├── layouts/                    # Layout components
│   │   ├── public-layout.tsx       # Landing/login layout
│   │   └── app-layout.tsx          # Authenticated layout (sidebar + topbar)
│   │
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # Primitives (Button, Input, Badge, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── select.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── status-badge.tsx        # Colored badge per status
│   │   └── confirm-dialog.tsx
│   │
│   ├── pages/                      # Page components
│   │   ├── auth/
│   │   │   ├── login-page.tsx
│   │   │   ├── register-page.tsx
│   │   │   ├── confirm-email-page.tsx
│   │   │   └── two-factor-page.tsx
│   │   ├── dashboard/
│   │   │   └── dashboard-page.tsx
│   │   ├── orders/
│   │   │   ├── orders-list-page.tsx
│   │   │   ├── order-create-page.tsx
│   │   │   └── order-detail-page.tsx
│   │   ├── transactions/
│   │   │   ├── transactions-list-page.tsx
│   │   │   └── transaction-detail-page.tsx
│   │   ├── settings/
│   │   │   ├── settings-page.tsx
│   │   │   └── two-factor-setup-page.tsx
│   │   └── not-found-page.tsx
│   │
│   ├── lib/                        # Utilities
│   │   ├── utils.ts                # Formatadores (moeda, data)
│   │   ├── constants.ts
│   │   └── idempotency.ts          # UUID v4 generator
│   │
│   └── types/                      # TypeScript types
│       ├── auth.ts
│       ├── order.ts
│       ├── transaction.ts
│       └── api.ts                  # ApiResponse<T>, PaginatedResponse, ErrorDetail
│
└── tests/
    ├── setup.ts                    # Vitest setup
    ├── mocks/
    │   └── handlers.ts             # MSW handlers (se usar MSW)
    ├── components/                 # Component tests
    └── pages/                      # Page tests
```

---

## 3. Component Tree

```
<App>
  <QueryClientProvider>
    <RouterProvider>
      <Routes>
        {/* Public Layout */}
        <PublicLayout>
          <LoginPage />
          <RegisterPage />
          <ConfirmEmailPage />
          <TwoFactorPage />        {/* protected by twoFactorToken */}
        </PublicLayout>

        {/* App Layout (auth required) */}
        <AppLayout>               {/* Sidebar + Topbar + <Outlet /> */}
          <DashboardPage />
          <OrdersListPage />
          <OrderCreatePage />
          <OrderDetailPage />
          <TransactionsListPage />
          <TransactionDetailPage />
          <SettingsPage />
          <TwoFactorSetupPage />
          <NotFoundPage />
        </AppLayout>
      </Routes>
    </RouterProvider>
  </QueryClientProvider>

  <Toaster />                     {/* Global toast container */}
</App>
```

---

## 4. Data Flow

### 4.1 Auth Flow

```
LoginPage                           AuthStore (Zustand)
   │                                    │
   ├─ submit(email, password) ──────►  setLoading(true)
   │                                    │
   ▼                                    │
POST /api/v1/auth/login                 │
   │                                    │
   ├─ [requiresTwoFactor=true] ──────► navigate('/2fa-verify')
   │                                    │
   ├─ [success] ────────────────────►  setToken(accessToken)
   │                                    setUser(user)
   │                                    navigate('/')
   │
   ▼
Axios interceptor:
  - request: inject Authorization header
  - response: on 401 → try POST /api/v1/auth/refresh (cookie)
    → if refresh fails → authStore.clear() → navigate('/login')
```

### 4.2 TanStack Query Flow

```
Page Component
    │
    ├─ useQuery('transactions', getTransactions, { page, status })
    │       │
    │       ├─ returns { data, isLoading, error }
    │       ├─ cache, background refetch, stale management
    │       └─ automatic retry on failure (3x)
    │
    ├─ useMutation(postTransaction, { idempotencyKey })
    │       │
    │       ├─ onSuccess → invalidate queries → toast success
    │       └─ onError → toast error with API message
    │
    └─ <Skeleton /> when isLoading
       <ErrorAlert /> when error
       <Data /> when data
```

---

## 5. Tipos TypeScript

```typescript
// API Envelope
interface ApiResponse<T> {
  data: T;
  meta: { timestamp: string; requestId: string };
  errors: ErrorDetail[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  errors: ErrorDetail[];
}

// Auth
interface LoginRequest { email: string; password: string; totpCode?: string; }
interface LoginResponse { accessToken: string; tokenType: string; expiresIn: number; requiresTwoFactor?: boolean; twoFactorToken?: string; }
interface RegisterRequest { email: string; password: string; fullName: string; role: 'MERCHANT'; }
interface UserProfile { userId: string; email: string; fullName: string; role: string; twoFactorEnabled: boolean; emailConfirmed: boolean; createdAt: string; }

// Orders
interface Order { orderId: string; status: OrderStatus; totalInCents: number; items: OrderItem[]; expiresAt?: string; createdAt: string; }
type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
interface OrderItem { productId: string; description: string; quantity: number; unitPriceInCents: number; subtotalInCents: number; }

// Transactions
interface Transaction { transactionId: string; mpPaymentId?: number; status: TransactionStatus; amountInCents: number; currency: string; cardBrand?: string; cardLastFour?: string; orderId: string; createdAt: string; processingTimeMs: number; }
type TransactionStatus = 'APPROVED' | 'DECLINED' | 'SUSPECTED_FRAUD' | 'FULLY_REFUNDED' | 'PARTIALLY_REFUNDED';
interface RefundRequest { amountInCents: number; reason: RefundReason; requestedBy: string; idempotencyKey: string; }
```

---

## 6. Utilitários

| Lib | Uso |
|-----|-----|
| `date-fns` | Formatação de datas |
| `clsx` | Classname conditional |
| `uuid` | Geração de Idempotency-Key |
| `@tanstack/react-query` | Server state, cache, mutations |
| `zustand` | Client state (auth) |
| `axios` | HTTP client |
| `react-router-dom` | Routing |

---

## 7. Docker

**Multi-stage build:**
1. **Builder:** `node:22-alpine` — `npm ci && npm run build`
2. **Runtime:** `nginx:alpine` — copia `dist/` para `/usr/share/nginx/html`

**nginx.conf:** SPA fallback (`try_files $uri $uri/ /index.html`), gzip, cache headers.

---

## 8. Testes

| Tipo | Ferramenta | O que testar |
|------|-----------|--------------|
| Unitário | Vitest + Testing Library | Componentes isolados, hooks, utils |
| Integração | Vitest + MSW | Páginas com mock de API |
| E2E | Playwright | Fluxo completo: registro → login → criar pedido → ver transação |

**Setup:** `vitest.setup.ts` com `@testing-library/jest-dom` e MSW server.

---

## 9. Variáveis de Ambiente

```
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=Acabou o Mony
```
