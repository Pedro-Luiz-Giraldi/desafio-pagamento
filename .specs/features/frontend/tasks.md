# Frontend — Tasks

**Versão:** 1.0
**Data:** 2026-06-22

---

## Fase 1 — Fundação [P]

| # | Tarefa | Onde | Depende de | Feito quando | Reuses |
|---|-------|------|-----------|-------------|--------|
| T-01 | Scaffold Vite + React 19 + TypeScript + ESLint + Prettier | `frontend/` | — | `npm run dev` abre em branco | — |
| T-02 | Configurar Tailwind CSS 4 + PostCSS + CSS reset | `frontend/` | T-01 | Tailwind classes funcionam | — |
| T-03 | Criar diretórios + types + API client (Axios) + constants | `frontend/src/` | T-01 | `api/client.ts` exporta axios instance | — |
| T-04 | Docker multi-stage (node → nginx) + nginx.conf | `frontend/` | T-01 | `docker build -t aom-frontend` funciona | — |

## Fase 2 — Auth [P] — TLC Approved

**Status:** Approved for execution
**Scope preservado:** login, registro, confirmação de email, refresh automático, logout e 2FA TOTP conforme `spec.md`, `context.md` e `design.md`.
**Comandos a partir de:** `frontend/`

### Gate Commands

| Gate | Comando | Quando usar |
|------|---------|-------------|
| quick | `npm test -- <test-file>` | Tarefa com teste unitário/component isolado |
| auth | `npm test -- src/api/auth.api.test.ts src/stores/auth.store.test.ts src/api/client.test.ts` | Camada auth/API/interceptor |
| ui | `npm test -- src/components/ui src/layouts/public-layout.test.tsx` | Primitivos e layout público |
| phase | `npm run lint && npm run build && npm test` | Última tarefa da fase ou antes de avançar para Fase 3 |

### Execution Plan

```
T-03
 ├── T-05A ── T-05B ── T-06
 ├── T-07A ─┬─ T-07B ─┬─ T-07C ─┬─ T-07D
 │          ├─ T-07E ─┼─ T-07F ─┼─ T-07G ── T-07H
 │          └─────────┴─────────┴───────────┘
 └── T-08

T-05B + T-07A..H + T-08 ── T-09 ─┐
                                 ├── Fase 2 complete
T-05B + T-07A..H + T-08 ── T-10 ─┤
T-05B + T-07A..H + T-08 ── T-11 ─┤
T-05B + T-07A..H + T-08 ── T-12 ─┘
```

### Task Breakdown

#### T-05A: Auth store state model

**What:** Refinar `useAuthStore` para armazenar sessão local, usuário, loading e token temporário de 2FA.
**Where:** `frontend/src/stores/auth.store.ts`, `frontend/src/stores/auth.store.test.ts`
**Depends on:** T-03
**Reuses:** Zustand já instalado, tipos em `frontend/src/types/auth.ts`
**Requirement:** FR-AUTH-004, FR-AUTH-008

**Done when:**
- [ ] Store expõe `accessToken`, `user`, `isLoading` e `twoFactorToken`
- [ ] Store expõe actions para setar token, usuário, loading, token 2FA e limpar sessão
- [ ] `clear()` remove access token, usuário e token 2FA
- [ ] Testes cobrem estado inicial, atualização de sessão, token 2FA e limpeza

**Tests:** unit
**Gate:** quick — `npm test -- src/stores/auth.store.test.ts`
**Commit:** `feat(auth): refine auth store state`

#### T-05B: Auth API layer

**What:** Criar camada de API de autenticação com os endpoints públicos e de sessão.
**Where:** `frontend/src/api/auth.api.ts`, `frontend/src/api/auth.api.test.ts`
**Depends on:** T-05A
**Reuses:** `frontend/src/api/client.ts`, tipos em `frontend/src/types/auth.ts`
**Requirement:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-005, FR-AUTH-006, FR-AUTH-007

**Done when:**
- [ ] Exporta funções para `register`, `confirmEmail`, `login`, `verifyTwoFactor`, `refresh` e `logout`
- [ ] Usa rotas `/api/v1/auth/*` definidas na spec
- [ ] `register` força `role: 'MERCHANT'`
- [ ] `refresh` e `logout` preservam envio de cookie via `withCredentials`
- [ ] Testes cobrem método, URL e payload de cada chamada

**Tests:** unit
**Gate:** quick — `npm test -- src/api/auth.api.test.ts`
**Commit:** `feat(auth): add auth api layer`

#### T-06: Axios auth interceptor

**What:** Completar interceptor Axios para Authorization header e refresh automático em `401`.
**Where:** `frontend/src/api/client.ts`, `frontend/src/api/client.test.ts`
**Depends on:** T-05B
**Reuses:** `useAuthStore`, `API_BASE_URL`
**Requirement:** FR-AUTH-006, FR-AUTH-008, FR-UX-006

**Done when:**
- [ ] Requests com `accessToken` recebem `Authorization: Bearer <token>`
- [ ] Primeiro `401` tenta `POST /api/v1/auth/refresh` com cookie
- [ ] Refresh bem-sucedido atualiza store, atualiza header original e repete a request uma vez
- [ ] Refresh falho limpa sessão e redireciona para `/login`
- [ ] Loop de refresh é impedido por `_retry`
- [ ] Testes cobrem header, refresh sucesso, refresh falho e prevenção de retry infinito

**Tests:** unit
**Gate:** auth
**Commit:** `feat(auth): refresh expired access tokens`

#### T-07A: Button primitive [P]

**What:** Criar botão reutilizável com variantes e estados básicos.
**Where:** `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/button.test.tsx`
**Depends on:** T-03
**Reuses:** `frontend/src/lib/utils.ts`
**Requirement:** FR-UX-001

**Done when:**
- [ ] Renderiza `children`, repassa props nativas de `button` e suporta `disabled`
- [ ] Suporta variantes mínimas `primary`, `secondary`, `ghost` e `danger`
- [ ] Mantém foco visível e estilos compatíveis com Tailwind 4
- [ ] Testes cobrem renderização, click e disabled

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/button.test.tsx`
**Commit:** `feat(ui): add button primitive`

#### T-07B: Input primitive [P]

**What:** Criar input reutilizável com label, erro e texto auxiliar.
**Where:** `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/input.test.tsx`
**Depends on:** T-03
**Reuses:** `frontend/src/lib/utils.ts`
**Requirement:** FR-AUTH-009, FR-UX-001

**Done when:**
- [ ] Associa label ao campo por `htmlFor`/`id`
- [ ] Exibe erro com `aria-invalid` e descrição acessível
- [ ] Repassa props nativas de `input`
- [ ] Testes cobrem label, erro e digitação

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/input.test.tsx`
**Commit:** `feat(ui): add input primitive`

#### T-07C: Card primitive [P]

**What:** Criar container de card para formulários e blocos simples.
**Where:** `frontend/src/components/ui/card.tsx`, `frontend/src/components/ui/card.test.tsx`
**Depends on:** T-03
**Reuses:** `frontend/src/lib/utils.ts`
**Requirement:** FR-UX-001

**Done when:**
- [ ] Exporta `Card`, `CardHeader`, `CardTitle`, `CardContent` e `CardFooter`
- [ ] Mantém raio de borda máximo de 8px
- [ ] Testes cobrem composição das partes

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/card.test.tsx`
**Commit:** `feat(ui): add card primitive`

#### T-07D: Spinner and Skeleton primitives [P]

**What:** Criar indicadores de carregamento reutilizáveis.
**Where:** `frontend/src/components/ui/spinner.tsx`, `frontend/src/components/ui/skeleton.tsx`, `frontend/src/components/ui/loading.test.tsx`
**Depends on:** T-03
**Reuses:** `frontend/src/lib/utils.ts`
**Requirement:** FR-UX-004

**Done when:**
- [ ] `Spinner` possui nome acessível para leitores de tela
- [ ] `Skeleton` aceita `className` e não altera layout ao carregar
- [ ] Testes cobrem renderização acessível e customização visual

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/loading.test.tsx`
**Commit:** `feat(ui): add loading primitives`

#### T-07E: Badge primitive [P]

**What:** Criar badge genérico para status e labels compactos.
**Where:** `frontend/src/components/ui/badge.tsx`, `frontend/src/components/ui/badge.test.tsx`
**Depends on:** T-03
**Reuses:** `frontend/src/lib/utils.ts`
**Requirement:** FR-ORD-007, FR-TXN-007

**Done when:**
- [ ] Suporta variantes `neutral`, `success`, `warning`, `danger` e `info`
- [ ] Renderiza texto curto sem quebrar layout
- [ ] Testes cobrem variantes e conteúdo

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/badge.test.tsx`
**Commit:** `feat(ui): add badge primitive`

#### T-07F: Modal primitive [P]

**What:** Criar modal base acessível para confirmações e formulários curtos.
**Where:** `frontend/src/components/ui/modal.tsx`, `frontend/src/components/ui/modal.test.tsx`
**Depends on:** T-03
**Reuses:** React portals se necessário, `frontend/src/lib/utils.ts`
**Requirement:** FR-UX-007

**Done when:**
- [ ] Renderiza apenas quando `open=true`
- [ ] Expõe título acessível e botão/ação de fechar
- [ ] Fecha por callback ao clicar no backdrop ou botão de fechar
- [ ] Testes cobrem aberto, fechado e fechamento

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/modal.test.tsx`
**Commit:** `feat(ui): add modal primitive`

#### T-07G: Toast primitive [P]

**What:** Criar mecanismo mínimo de toast para feedback global.
**Where:** `frontend/src/components/ui/toast.tsx`, `frontend/src/components/ui/toast.test.tsx`
**Depends on:** T-03
**Reuses:** Zustand ou React state local, conforme implementação mais simples
**Requirement:** FR-AUTH-009, FR-UX-005, CA-008

**Done when:**
- [ ] Exporta `Toaster` e função/hook para disparar toast
- [ ] Suporta tipos `success`, `error` e `info`
- [ ] Mensagens usam região acessível `role="status"` ou `role="alert"` conforme tipo
- [ ] Testes cobrem disparo e remoção de toast

**Tests:** component
**Gate:** quick — `npm test -- src/components/ui/toast.test.tsx`
**Commit:** `feat(ui): add toast primitive`

#### T-07H: UI barrel exports

**What:** Exportar os primitivos de UI em um ponto de entrada estável.
**Where:** `frontend/src/components/ui/index.ts`
**Depends on:** T-07A, T-07B, T-07C, T-07D, T-07E, T-07F, T-07G
**Reuses:** Primitivos criados na Fase 2
**Requirement:** FR-UX-001

**Done when:**
- [ ] `index.ts` exporta todos os primitivos da Fase 2
- [ ] Import via `@/components/ui` funciona nas páginas de auth
- [ ] `npm run build` não encontra exports ausentes

**Tests:** none
**Gate:** ui
**Commit:** `feat(ui): export ui primitives`

#### T-08: Public layout [P]

**What:** Criar layout público centralizado para login, cadastro, confirmação e 2FA.
**Where:** `frontend/src/layouts/public-layout.tsx`, `frontend/src/layouts/public-layout.test.tsx`
**Depends on:** T-03
**Reuses:** `APP_NAME`, UI primitives quando disponíveis
**Requirement:** FR-UX-001

**Done when:**
- [ ] Renderiza `children` em layout centralizado sem sidebar
- [ ] Exibe identidade mínima da aplicação sem landing page
- [ ] Funciona em largura de 360px sem overflow horizontal
- [ ] Testes cobrem renderização de children e estrutura acessível

**Tests:** component
**Gate:** quick — `npm test -- src/layouts/public-layout.test.tsx`
**Commit:** `feat(auth): add public layout`

#### T-09: Login page

**What:** Criar página de login com validação local e integração com auth API/store.
**Where:** `frontend/src/pages/auth/login-page.tsx`, `frontend/src/pages/auth/login-page.test.tsx`
**Depends on:** T-05B, T-07H, T-08
**Reuses:** `auth.api.ts`, `useAuthStore`, `PublicLayout`, UI primitives
**Requirement:** FR-AUTH-003, FR-AUTH-004, FR-AUTH-009, CA-001, CA-002

**Done when:**
- [ ] Valida email e senha obrigatórios antes de chamar API
- [ ] Login sem 2FA salva access token e usuário quando retornado
- [ ] Login com `requiresTwoFactor=true` salva `twoFactorToken` e navega para `/2fa-verify`
- [ ] Erros de API aparecem em toast ou erro de formulário
- [ ] Testes cobrem validação, sucesso sem 2FA, redirecionamento 2FA e erro

**Tests:** component/integration with mocked API
**Gate:** quick — `npm test -- src/pages/auth/login-page.test.tsx`
**Commit:** `feat(auth): add login page`

#### T-10: Register page

**What:** Criar página de cadastro merchant com validação local e role fixa.
**Where:** `frontend/src/pages/auth/register-page.tsx`, `frontend/src/pages/auth/register-page.test.tsx`
**Depends on:** T-05B, T-07H, T-08
**Reuses:** `auth.api.ts`, `PublicLayout`, UI primitives
**Requirement:** FR-AUTH-001, FR-AUTH-009, CA-001

**Done when:**
- [ ] Valida nome, email e senha obrigatórios antes de chamar API
- [ ] Envia cadastro com `role: 'MERCHANT'`
- [ ] Em sucesso, informa que o link de confirmação foi enviado por email e oferece retorno para `/login`
- [ ] Não navega para `/confirm-email` sem token
- [ ] Erros de API aparecem em toast ou erro de formulário
- [ ] Testes cobrem validação, payload com role merchant, sucesso e erro

**Tests:** component/integration with mocked API
**Gate:** quick — `npm test -- src/pages/auth/register-page.test.tsx`
**Commit:** `feat(auth): add register page`

#### T-11: Confirm email page

**What:** Criar página de confirmação de email baseada no token da URL.
**Where:** `frontend/src/pages/auth/confirm-email-page.tsx`, `frontend/src/pages/auth/confirm-email-page.test.tsx`
**Depends on:** T-05B, T-07H, T-08
**Reuses:** `auth.api.ts`, `PublicLayout`, UI primitives
**Requirement:** FR-AUTH-002, FR-AUTH-009, CA-001

**Done when:**
- [ ] Lê `token` de `/confirm-email?token=:token`
- [ ] Chama confirmação automaticamente quando token existe
- [ ] Exibe estado de loading, sucesso e erro
- [ ] Sem token, exibe erro claro e não chama API
- [ ] Testes cobrem token ausente, sucesso e erro

**Tests:** component/integration with mocked API
**Gate:** quick — `npm test -- src/pages/auth/confirm-email-page.test.tsx`
**Commit:** `feat(auth): add confirm email page`

#### T-12: Two-factor verify page

**What:** Criar segunda etapa de login com código TOTP.
**Where:** `frontend/src/pages/auth/two-factor-page.tsx`, `frontend/src/pages/auth/two-factor-page.test.tsx`
**Depends on:** T-05B, T-07H, T-08, T-09
**Reuses:** `auth.api.ts`, `useAuthStore`, `PublicLayout`, UI primitives
**Requirement:** FR-AUTH-004, FR-AUTH-005, FR-AUTH-009, CA-002

**Done when:**
- [ ] Exige `twoFactorToken` da store; sem ele, redireciona para `/login`
- [ ] Valida código TOTP antes de chamar API
- [ ] Verificação bem-sucedida salva sessão e navega para `/`
- [ ] Erros de API aparecem em toast ou erro de formulário
- [ ] Gate de fase passa com lint, build e todos os testes
- [ ] Testes cobrem ausência de token, validação, sucesso e erro

**Tests:** component/integration with mocked API
**Gate:** phase
**Commit:** `feat(auth): add two-factor verification page`

### TLC Validation

| Check | Resultado |
|-------|-----------|
| Task Granularity | OK — tarefas divididas por store, API, interceptor, primitive, layout ou página |
| Diagram-Definition Cross-Check | OK — dependências do mapa batem com `Depends on` |
| Test Co-location | OK — cada tarefa com código testável inclui teste no mesmo deliverable |
| Decision Preservation | OK — stack, APIs, rotas, auth model e layout já decididos foram mantidos |

## Fase 3 — App Shell

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-13 | App layout (sidebar + topbar + outlet) | `layouts/app-layout.tsx`, `components/sidebar.tsx`, `components/topbar.tsx` | T-07, T-08 | Sidebar navega, topbar mostra user |
| T-14 | Route guard + router setup | `App.tsx`, `routes.tsx` | T-06, T-13 | Rotas privadas redirecionam para /login |
| T-15 | StatusBadge + ConfirmDialog | `components/status-badge.tsx`, `components/confirm-dialog.tsx` | T-07 | Badge colorido por status, modal de confirm |

## Fase 4 — Dashboard

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-16 | Dashboard API hooks (TanStack Query) | `hooks/use-transactions.ts`, `hooks/use-orders.ts` | T-03 | Queries para listar transações e pedidos |
| T-17 | Dashboard page (summary cards + recent lists) | `pages/dashboard/dashboard-page.tsx` | T-13, T-14, T-15, T-16 | Cards com métricas, skeletons, erro |

## Fase 5 — Orders

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-18 | Orders list page (tabela + filtros + paginação) | `pages/orders/orders-list-page.tsx` | T-13, T-14, T-15, T-16 | Lista, filtra por status, pagina |
| T-19 | Order create page (formulário com itens dinâmicos) | `pages/orders/order-create-page.tsx` | T-13, T-14, T-07 | Cria pedido, redirect para detalhe |
| T-20 | Order detail page (info + cancel action) | `pages/orders/order-detail-page.tsx` | T-13, T-14, T-15, T-16 | Detalhes, cancelar com confirmação |

## Fase 6 — Transactions

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-21 | Transactions list page (tabela + filtros + paginação) | `pages/transactions/transactions-list-page.tsx` | T-13, T-14, T-15, T-16 | Lista, filtra por status, pagina |
| T-22 | Transaction detail page (info + refund form) | `pages/transactions/transaction-detail-page.tsx` | T-13, T-14, T-15, T-16 | Detalhes, estorno parcial/total |

## Fase 7 — Settings

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-23 | Profile settings page (nome, email, info) | `pages/settings/settings-page.tsx` | T-13, T-14, T-07 | Exibe e edita perfil |
| T-24 | 2FA setup page (QR code + recovery codes) | `pages/settings/two-factor-setup-page.tsx` | T-13, T-14, T-07 | Setup + confirm + recovery codes |

## Fase 8 — Finalização [P]

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-25 | 404 page + favicon + title | `pages/not-found-page.tsx`, `index.html` | T-13 | Página 404 customizada |
| T-26 | Responsive fixes + mobile sidebar | — | T-13 | Sidebar colapsável, layout funcional em 360px+ |
| T-27 | Playwright E2E: login → create order → view transactions | `tests/e2e/` | T-04 | Fluxo crítico passa em headless Chrome |

---

## Grafo de Dependências

```
                    T-01
                  /  |  \
                 /   |   \
              T-02  T-03  T-04
                     |
                ┌────┼────┐
               T-05 T-07 T-16
                |    |     |
               T-06  |     |
              /  \   |     |
             /    \  |     |
          T-08    T-09...  |
          /       /        |
     T-13 ── T-14 ────────┘
       |        |
     T-15    ┌──┴──┐
             │     │
           T-17  T-18 T-21
             │     │     │
           T-20  T-19 T-22
                     │
                   T-23 T-24
                     │
                   T-25 T-26
                     │
                   T-27
```

**Legenda:** `[P]` = tasks paralelizáveis na mesma fase.

---

## Gate Checks por Fase

| Fase | Gate |
|------|------|
| F1 | `npm run dev` + Tailwind classes renderizam |
| F2 | `npm run lint && npm run build && npm test`; páginas auth cobrem login/registro/confirmação/2FA com API mockada |
| F3 | Sidebar navega, rota privada redireciona sem token |
| F4 | Dashboard mostra dados reais (ou mock) |
| F5 | CRUD de pedidos completo |
| F6 | Lista + estorno funcionam |
| F7 | Perfil + 2FA configuráveis |
| F8 | `npm run build` + testes E2E passam |
