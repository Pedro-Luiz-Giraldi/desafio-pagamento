# STATE — Frontend Merchant Dashboard

**Última atualização:** 2026-06-22
**Sessão ativa:** Onda 1 concluída

---

## Progresso Atual

| Onda | Status | Tasks |
|------|--------|-------|
| **Onda 1 — Fundação** | ✅ Completa | T-01 a T-04 |
| **Onda 2 — Auth** | ⏳ Pendente | T-05 a T-12 |
| **Onda 3 — App Shell** | ⏳ Pendente | T-13 a T-15 |
| **Onda 4 — Features** | ⏳ Pendente | T-16 a T-24 |
| **Onda 5 — Finalização** | ⏳ Pendente | T-25 a T-27 |

## Onda 1 — Detalhes da Execução

### T-01: Scaffold Vite + React 19 + TypeScript ✓
- `npm create vite@latest frontend --template react-ts`
- Dependências instaladas: react-router-dom, @tanstack/react-query, zustand, axios, clsx, date-fns, uuid
- Dev deps: tailwindcss, @tailwindcss/vite, prettier, vitest, @testing-library/*
- ESLint configurado (template padrão), Prettier configurado (`.prettierrc`)
- Porta dev: 5173

### T-02: Tailwind CSS 4 + PostCSS ✓
- `@import 'tailwindcss'` no `src/index.css`
- Plugin `@tailwindcss/vite` no `vite.config.ts`
- CSS reset mínimo inline

### T-03: Estrutura + Types + API + Utils ✓
```
src/
├── api/client.ts              ← Axios instance + interceptors (auth + refresh)
├── lib/constants.ts           ← VITE_API_BASE_URL, APP_NAME, PAGE_SIZE
├── lib/idempotency.ts         ← UUID v4 generator
├── lib/utils.ts               ← formatCents, formatDate, cn
├── stores/auth.store.ts       ← Zustand: accessToken, user, loading
├── types/api.ts               ← ApiResponse<T>, PaginatedResponse<T>, ErrorDetail
├── types/auth.ts              ← LoginRequest/Response, RegisterRequest/Response, etc
├── types/order.ts             ← Order, OrderDetail, CreateOrderRequest, OrderStatus
├── types/transaction.ts       ← Transaction, TransactionDetail, RefundRequest
├── test/setup.ts              ← @testing-library/jest-dom
├── vite-env.d.ts              ← Vite client types
├── main.tsx                   ← QueryClientProvider + StrictMode
└── App.tsx                    ← BrowserRouter placeholder
```

### T-04: Docker + nginx ✓
- `Dockerfile` multi-stage (node:22-alpine build → nginx:alpine runtime)
- `nginx.conf` com SPA fallback, gzip, proxy /api/ → api-gateway:8080
- Build verificado: `docker build -t aom-frontend:latest`

### Gates verficados
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo |
| `npx vite build` | ✅ 256KB JS, 6.5KB CSS |
| `npm run lint` | ✅ Sem warnings |
| `docker build` | ✅ `aom-frontend:latest` |

## Próximos Passos

### Onda 2 — Auth (T-05 a T-12)
1. **T-05:** API layer de auth (`auth.api.ts`) + hooks TanStack Query (`use-auth.ts`)
2. **T-06:** Refinar interceptors de refresh (já esboçado em client.ts)
3. **T-07:** UI primitives (Button, Input, Card, Badge, Modal, Toast, Skeleton, Spinner, Pagination, Select)
4. **T-08:** PublicLayout (centralizado, sem sidebar)
5. **T-09 a T-12:** Login, Register, ConfirmEmail, TwoFactorVerify pages

### Execução
- T-05, T-07 e T-08 podem ser paralelizados (Rack A)
- T-06, T-09/T-10/T-11/T-12 são sequenciais (Rack B, dependem de Rack A)

## Decisões Registradas

| ID | Decisão | Fonte |
|----|---------|-------|
| D-01 | React 19 + Vite + TypeScript | Discussão usuário |
| D-02 | Tailwind CSS 4 | Discussão usuário |
| D-03 | TanStack Query + Zustand | Discussão usuário |
| D-04 | React Router v7 | Discussão usuário |
| D-05 | Axios com interceptors | Discussão usuário |
| D-06 | Vitest + Testing Library + Playwright | Discussão usuário |
| D-07 | Docker multi-stage (node → nginx) | Discussão usuário |
| D-08 | MVP focado em merchants (dashboard B2B) | Discussão usuário |
| D-09 | Refresh token via cookie httpOnly | Contexto do backend (api-contracts.md) |
| D-10 | JWT Bearer via Authorization header | Contexto do backend (api-contracts.md) |
| D-11 | Sidebar + topbar como layout autenticado | Design.md |

## Issues Conhecidos

| ID | Descrição | Impacto | Prioridade |
|----|-----------|---------|------------|
| IS-01 | `orders.api.ts`, `transactions.api.ts`, `users.api.ts` ainda não criados | Bloqueia Onda 4 | Alta |
| IS-02 | Playwright não instalado | Bloqueia T-27 | Média |
| IS-03 | Testes unitários: zero no momento | Gate de cobertura falha | Média |

## Preferências

- Modelos rápidos (GPT-4.1 Mini / Claude Haiku) funcionam bem para tarefas de implementação frontend.
- Modelos grandes reservados para design/arquitetura e debugging complexo.
