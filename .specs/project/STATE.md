# STATE — Frontend Merchant Dashboard

**Última atualização:** 2026-06-25
**Sessão ativa:** Onda 4 completa ✅ — Todos os gates passando

---

## Progresso Atual

| Onda | Status | Tasks |
|------|--------|-------|
| **Onda 1 — Fundação** | ✅ Completa | T-01 a T-04 |
| **Onda 2 — Auth** | ✅ Completa | T-05 a T-12 |
| **Onda 3 — App Shell** | ✅ Completa | T-13 a T-15 |
| **Onda 4 — Features** | ✅ Completa | T-16 a T-24 |
| **Onda 5 — Finalização** | ⏳ Pendente | T-25 a T-27 |

## Onda 1 — Detalhes da Execução

### T-01: Scaffold Vite + React 19 + TypeScript ✓
- `npm create vite@latest frontend --template react-ts`
- Dependências instaladas: react-router-dom, @tanstack/react-query, zustand, axios, clsx, date-fns, uuid
- Dev deps: tailwindcss, @tailwindcss/vite, prettier, vitest, @testing-library/*, axios-mock-adapter
- ESLint configurado (template padrão), Prettier configurado (`.prettierrc`)
- Porta dev: 5173

### T-02: Tailwind CSS 4 + PostCSS ✓
- `@import 'tailwindcss'` no `src/index.css`
- Plugin `@tailwindcss/vite` no `vite.config.ts`
- CSS reset mínimo inline

### T-03: Estrutura + Types + API + Utils ✓
- `src/types/` criado com `auth.ts`, `api.ts`, `common.ts`
- `src/api/` criado com `client.ts` (axios instance)
- `src/lib/` criado com `cn.ts` (clsx wrapper), `toast-store.ts` (zustand)
- `src/utils/` criado com `validation.ts`, `format.ts`
- `src/components/` criado com `ui/` subdir

### T-04: Git + ESLint + Prettier ✓
- `.gitignore` configurado
- ESLint + Prettier integrados
- Commit inicial realizado

## Onda 2 — Execução Completa ✅

### T-05A: Auth store state model ✓
- `useAuthStore` agora guarda `accessToken`, `user`, `twoFactorToken` e `isLoading`
- `clear()` limpa sessão completa
- Testes criados e passando

### T-05B: Auth API layer ✓
- `frontend/src/api/auth.api.ts` criado
- Endpoints cobertos: `register`, `confirmEmail`, `login`, `verifyTwoFactor`, `refresh`, `logout`
- `register` fixa `role: 'MERCHANT'`
- Testes criados e passando

### T-06: Axios auth interceptor ✓
- Header `Authorization` com bearer token implementado
- Refresh automático em `401` implementado
- Redirecionamento para `/login` em refresh falho implementado
- **Correções aplicadas:**
  - Adicionado guard `original &&` para evitar undefined
  - Teste refatorado para usar `axios-mock-adapter` em vez de acessar internals
  - TypeScript limpo: `npx tsc -b` passa sem erros

### T-07: UI primitives ✓
- `Button`, `Input`, `Card`, `Spinner`, `Skeleton`, `Badge`, `Modal`, `Toaster` implementados
- `components/ui/index.ts` exportado
- **Correções aplicadas:**
  - Toast refatorado: lógica imperativa movida para `lib/toast-store.ts`
  - Componente `Toaster` agora apenas consome o store via `useSyncExternalStore`
  - API `toast` exportada diretamente de `lib/toast-store.ts` via `components/ui/index.ts`
  - Satisfaz `react-refresh/only-export-components`
- Testes criados e passando

### T-08: Public layout ✓
- `PublicLayout` implementado
- Testes criados e passando

### T-09 a T-12: Auth pages ✓
- `LoginPage`, `RegisterPage`, `ConfirmEmailPage`, `TwoFactorPage` implementadas
- Rotas públicas adicionadas em `App.tsx`
- Testes criados e passando

### Gates verificados (Onda 2) — ✅ TODOS PASSANDO
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo (zero erros) |
| `npm run lint` | ✅ Sem erros ou warnings |
| `npm run build` | ✅ 312.93 KB JS (gzip: 101.39 KB), 16.38 KB CSS (gzip: 4.05 KB) |
| `npm test` | ✅ 41 testes passando em 15 arquivos (4.32s) |

**Ambiente:** Node v22.22.3 via nvm no WSL

## Onda 3 — Execução Completa ✅

### T-13: Authenticated Layout ✓
- `AuthenticatedLayout` implementado com sidebar e topbar
- Sidebar com logo, navegação (Dashboard, Pedidos, Transações, Configurações) e footer
- Topbar com título e área de usuário (nome, email, botão Sair)
- Logout flow: chama `authApi.logout()`, limpa `authStore`, redireciona para `/login`
- NavLink com highlight visual para rota ativa
- Testes criados e passando

### T-14: Protected Route Guard ✓
- `ProtectedRoute` implementado
- Verifica `accessToken` no `useAuthStore`
- Redireciona para `/login` se não autenticado
- Renderiza children se autenticado
- Testes criados e passando (usando MemoryRouter)

### T-15: Dashboard Home (Placeholder) ✓
- `DashboardPage` implementado
- Exibe boas-vindas com nome do usuário
- Cards placeholder para Dashboard, Pedidos, Transações
- Card "Em Construção" com lista de features futuras
- Testes criados e passando

### Rotas Atualizadas ✓
- `App.tsx` atualizado com rotas protegidas
- `/` → Dashboard (protegido)
- `/orders`, `/transactions`, `/settings` → Placeholders (protegidos)
- Rotas públicas mantidas: `/login`, `/register`, `/confirm-email`, `/2fa-verify`

### Gates verificados (Onda 3) — ✅ TODOS PASSANDO
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo (zero erros) |
| `npm run build` | ✅ 318.14 KB JS (gzip: 102.77 KB), 17.83 KB CSS (gzip: 4.37 KB) |
| `npm test` | ✅ 53 testes passando em 18 arquivos (5.14s) |

**Novos arquivos:**
- `src/components/protected-route.tsx` + test
- `src/layouts/authenticated-layout.tsx` + test
- `src/pages/dashboard/dashboard-page.tsx` + test
- `.specs/features/app-shell/spec.md`

## Onda 4 — Execução Completa ✅

### T-16: Dashboard/Orders/Transactions API hooks ✓
- `src/hooks/use-orders.ts` — `useOrdersList`, `useOrder`, `useCreateOrder`, `useCancelOrder`
- `src/hooks/use-transactions.ts` — `useTransactionsList`, `useTransaction`, `useRefundTransaction`
- Usam TanStack Query com cache e invalidação automática

### T-17: Dashboard Page (real data) ✓
- Dashboard reescrito com dados reais de pedidos pendentes e transações recentes
- Cards de métricas, listas recentes, ações rápidas
- Loading states com Skeleton e empty states

### T-18: Orders List Page ✓
- Tabela com paginação e filtro por status
- Navegação para criar e detalhe

### T-19: Order Create Page ✓
- Formulário com itens dinâmicos (adicionar/remover)
- Validação de valor total

### T-20: Order Detail Page ✓
- Info do pedido + itens + cancelamento com confirmação

### T-21: Transactions List Page ✓
- Tabela com paginação e filtro por status

### T-22: Transaction Detail Page ✓
- Info da transação + estorno parcial/total com motivo

### T-23: Profile Settings Page ✓
- Editar nome, exibir email, link para 2FA

### T-24: Two-Factor Setup Page ✓
- Fluxo completo: QR code → TOTP → recovery codes
- Desativação de 2FA

### API Layers Adicionados ✓
- `src/api/orders.api.ts` — list, getById, create, cancel
- `src/api/transactions.api.ts` — list, getById, refund
- `src/api/users.api.ts` — profile, 2FA setup/confirm/disable

### UI Components Adicionados ✓
- `Pagination`, `Select`, `StatusBadge`, `ConfirmDialog`

### Rotas Atualizadas ✓
- `/orders`, `/orders/new`, `/orders/:id` — protegidas
- `/transactions`, `/transactions/:id` — protegidas
- `/settings`, `/settings/2fa` — protegidas

### Gates verificados (Onda 4) — ✅ TODOS PASSANDO
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo (zero erros) |
| `npm run build` | ✅ 361.17 KB JS (gzip: 111.70 KB), 21.21 KB CSS (gzip: 4.93 KB) |
| `npm test` | ✅ 119 testes passando em 32 arquivos |

