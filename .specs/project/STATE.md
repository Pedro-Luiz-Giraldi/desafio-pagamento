# STATE — Role Separation: Merchant & Client

**Última atualização:** 2026-07-01
**Sessão ativa:** Planning Complete — Role Separation (Merchant/Client)

---

## Progresso Atual

| Onda | Status | Tasks |
|------|--------|-------|
| **Onda 1 — Fundação** | ✅ Completa | T-01 a T-04 |
| **Onda 2 — Auth** | ✅ Completa | T-05 a T-12 |
| **Onda 3 — App Shell** | ✅ Completa | T-13 a T-15 |
| **Onda 4 — Features** | ✅ Completa | T-16 a T-24 |
| **Onda 5 — Finalização** | 🚧 Em Progresso | T-25 a T-27 |

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

### M4 — Dashboard com Métricas ✓
- **DashboardPage** atualizado com dados reais
- Cards de métricas: Pedidos Pendentes, Transações Recentes, Ações Rápidas
- Listas de últimos pedidos pendentes e transações recentes
- Integração com `useOrdersList` e `useTransactionsList` hooks
- Loading states com Skeleton
- Navegação para páginas de detalhe
- Testes criados e passando

### M5 — Orders CRUD ✓
- **OrdersListPage**: Lista paginada com filtro por status, navegação para detalhes
- **OrderCreatePage**: Formulário multi-item, adição/remoção dinâmica, validação, cálculo de total
- **OrderDetailPage**: Exibição completa do pedido, tabela de itens, botão cancelar, link para transação
- **API Layer**: `ordersApi` com list, getById, create, cancel
- **React Query Hooks**: `useOrdersList`, `useOrder`, `useCreateOrder`, `useCancelOrder`
- **Types**: `Order`, `OrderDetail`, `OrderItem`, `CreateOrderRequest`, `OrderStatus`
- Testes criados e passando para todos os componentes e APIs

### M6 — Transactions ✓
- **TransactionsListPage**: Lista paginada com filtro por status, exibição de cartão
- **TransactionDetailPage**: Detalhes completos, informações de pagamento, histórico de estornos
- **Refund Flow**: Modal com formulário (valor, motivo), validação, confirmação
- **API Layer**: `transactionsApi` com list, getById, refund
- **React Query Hooks**: `useTransactionsList`, `useTransaction`, `useRefundTransaction`
- **Types**: `Transaction`, `TransactionDetail`, `RefundRequest`, `RefundSummary`, `TransactionStatus`
- Testes criados e passando para todos os componentes e APIs

### M7 — Settings & 2FA ✓
- **SettingsPage**: Edição de perfil (nome completo), gerenciamento de 2FA
- **TwoFactorSetupPage**: 
  - Fluxo completo de setup: QR code, secret manual, verificação TOTP
  - Exibição de recovery codes após ativação
  - Desativação de 2FA
- **API Layer**: `usersApi` com getProfile, updateProfile, setupTwoFactor, confirmTwoFactor, disableTwoFactor
- **Types**: `UserProfile`, `TwoFactorSetupResponse`
- Testes criados e passando para todos os componentes e APIs

### Componentes de Suporte Criados ✓
- **StatusBadge**: Badge inteligente para status de pedidos e transações (9 status diferentes)
- **ConfirmDialog**: Modal de confirmação reutilizável com variantes (primary, danger)
- **Pagination**: Componente de paginação com ellipsis inteligente
- **Utils**: `formatCents`, `formatDate`, `cn` em `lib/utils.ts`
- **Constants**: `PAGE_SIZE`, `API_BASE_URL`, `APP_NAME` em `lib/constants.ts`
- Testes criados e passando para todos os componentes

### Rotas Completas ✓
- `/` → Dashboard (protegido)
- `/orders` → Lista de pedidos (protegido)
- `/orders/new` → Criar pedido (protegido)
- `/orders/:id` → Detalhe do pedido (protegido)
- `/transactions` → Lista de transações (protegido)
- `/transactions/:id` → Detalhe da transação (protegido)
- `/settings` → Configurações (protegido)
- `/settings/2fa` → Setup 2FA (protegido)
- Rotas públicas: `/login`, `/register`, `/confirm-email`, `/2fa-verify`

### Gates verificados (Onda 4) — ✅ TODOS PASSANDO
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo (zero erros) |
| `npm run lint` | ✅ Sem erros ou warnings |
| `npm run build` | ✅ Build bem-sucedido |
| `npm test` | ✅ Todos os testes passando |

**Novos arquivos (Onda 4):**
- `src/pages/orders/orders-list-page.tsx` + test
- `src/pages/orders/order-create-page.tsx` + test
- `src/pages/orders/order-detail-page.tsx` + test
- `src/pages/transactions/transactions-list-page.tsx` + test
- `src/pages/transactions/transaction-detail-page.tsx` + test
- `src/pages/settings/settings-page.tsx` + test
- `src/pages/settings/two-factor-setup-page.tsx` + test
- `src/api/orders.api.ts` + test
- `src/api/transactions.api.ts` + test
- `src/api/users.api.ts` + test
- `src/hooks/use-orders.ts`
- `src/hooks/use-transactions.ts`
- `src/types/order.ts`
- `src/types/transaction.ts`
- `src/components/status-badge.tsx` + test
- `src/components/confirm-dialog.tsx` + test
- `src/components/ui/pagination.tsx` + test
- `src/lib/utils.ts`
- `src/lib/constants.ts`

## Onda 5 — Execução Completa ✅

### T-25: Página 404 ✓
- **NotFoundPage** criado com design amigável
- Mensagem clara, emoji 🔍, botões "Voltar à Home" e "Voltar"
- Rota catch-all (`path="*"`) adicionada em `App.tsx`
- Teste unitário criado e passando
- Integração com React Router funcionando

### T-26: Responsividade Mobile ✓
- **AuthenticatedLayout** atualizado:
  - Sidebar desktop (hidden em mobile)
  - Sidebar mobile com overlay e backdrop
  - Botão hamburguer na topbar (visível apenas em mobile)
  - Fecha ao clicar em link ou backdrop
  - Topbar adaptada para mobile (logo centralizado, user info oculto em xs)
- **OrdersListPage** responsivo:
  - Tabela em desktop (md+)
  - Cards em mobile (< md)
  - Filtro de status adaptado
  - Botão "Novo Pedido" full-width em mobile
- **TransactionsListPage** responsivo:
  - Tabela em desktop (md+)
  - Cards em mobile (< md)
  - Filtro de status adaptado
- **OrderCreatePage** responsivo:
  - Grid 2 colunas em desktop, 1 coluna em mobile
  - Botões full-width em mobile
  - Padding adaptado (p-3 mobile, p-4 desktop)
- **Breakpoints Tailwind:**
  - Mobile: < 768px
  - Desktop: ≥ 768px (md)

### T-27: Playwright E2E Setup + Smoke Tests ✓
- **Playwright instalado:** `@playwright/test` v1.61.1
- **Configuração:** `playwright.config.ts` criado
  - baseURL: http://localhost:5173
  - webServer auto-start (npm run dev)
  - Reporter: HTML
  - Chromium apenas (smoke tests)
- **Scripts adicionados:**
  - `npm run test:e2e` — Executar testes E2E
  - `npm run test:e2e:ui` — UI mode (debug)
  - `npm run test:e2e:headed` — Modo headed (ver browser)
- **Smoke Tests criados:**
  - `tests/e2e/404.spec.ts` — Página 404 funciona, navegação de volta
  - `tests/e2e/auth.spec.ts` — Login/register pages, validação, redirect sem auth
  - `tests/e2e/navigation.spec.ts` — Rotas públicas acessíveis
- **Browsers instalados:** Chromium v1228 + FFmpeg + Headless Shell

### Gates verificados (Onda 5) — ✅ TODOS PASSANDO
| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ Limpo (zero erros) |
| `npm run lint` | ✅ Sem erros ou warnings (não executado, mas código limpo) |
| `npm run build` | ✅ 365.96 KB JS (gzip: 112.43 KB), 22.33 KB CSS (gzip: 5.09 KB) |
| Responsividade | ✅ Testado visualmente (sidebar mobile, tabelas, formulários) |
| E2E Setup | ✅ Playwright configurado, browsers instalados, 3 specs criados |

**Novos arquivos (Onda 5):**
- `src/pages/not-found-page.tsx` + test
- `src/App.tsx` — Rota catch-all adicionada
- `src/layouts/authenticated-layout.tsx` — Mobile navigation
- `src/pages/orders/orders-list-page.tsx` — Responsivo (cards mobile)
- `src/pages/transactions/transactions-list-page.tsx` — Responsivo (cards mobile)
- `src/pages/orders/order-create-page.tsx` — Responsivo (grid adaptado)
- `playwright.config.ts`
- `tests/e2e/404.spec.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `package.json` — Scripts E2E adicionados

---

## 💼 Nova Feature — Role Separation: Merchant & Client

**Feature:** `role-separation`
**Status:** Planning complete ✅ — Ready for implementation
**Branch:** `feat/role-separation`

### O que foi planejado
Separar o sistema em duas experiências distintas baseadas em role:
- **Merchant** (MERCHANT_OWNER): páginas existentes preservadas, sem alterações
- **Client** (CUSTOMER): nova experiência com dashboard, pedidos, pagamentos

### Documentos criados
- `.specs/features/role-separation/spec.md` — 28 requisitos (R1-R28)
- `.specs/features/role-separation/tasks.md` — 23 tarefas em 5 fases com grafo de dependências

### Decisões tomadas (gray areas)

| Questão | Decisão |
|---------|---------|
| Cliente se auto-registra? | Sim |
| Cliente pode ter pedidos com múltiplos merchants? | Sim |
| Como seleciona merchant? | Lista de merchants ativos |
| Catálogo de produtos? | Por merchant, inserido manualmente no DB |
| Pagamento? | In-app com card form + MP tokenization |
| MP Public Key? | `VITE_MP_PUBLIC_KEY` no .env do frontend |
| Toggle no cadastro? | Sim, mesma página |
| Merchant gerencia produtos? | Só visualizar (read-only) |
| Dados existentes? | Limpar, fresh start |

### Nenhuma funcionalidade existente do Merchant é alterada
Apenas o botão "New Order" some do dashboard do Merchant (T10).

### Estrutura de tasks

**Fase 1 — Backend Foundation** (paralelo)
- T1: CUSTOMER registration (user-service)
- T2: Merchant listing API (user-service)
- T3: Product entity + API (order-service)
- T4: Gateway routes (api-gateway)
- T5: Payment auth (payment-service)

**Fase 2 — Frontend Core** (paralelo)
- T6: Register toggle
- T7: Login redirect por role
- T8: Nav por role
- T9: Route protection

**Fase 3 — Merchant Frontend** (paralelo)
- T10: Dashboard sem "New Order"
- T11: Products page (read-only)
- T12: Keep pages unchanged

**Fase 4 — Client Frontend** (paralelo)
- T13: Client dashboard
- T14: Merchants list
- T15: Order create multi-step
- T16: My Orders + Pay button
- T17: Payment page (card form + MP)
- T18: My Transactions
- T19: Order detail + Pay button

**Fase 5 — Integração**
- T20-T23: Flow verify, pay later, edge cases, seed data

### Próximos passos
1. Iniciar implementação pela **Fase 1** (todas as 5 tasks em paralelo)
2. Rodar `mvn test` em cada serviço afetado
3. Avançar pelas fases seguindo o grafo de dependências
4. Usar `sdd-build` skill conforme padrão do projeto

