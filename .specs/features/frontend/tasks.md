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

## Fase 2 — Auth [P]

| # | Tarefa | Onde | Depende de | Feito quando |
|---|-------|------|-----------|-------------|
| T-05 | Auth store (Zustand) + auth API layer | `stores/auth.store.ts`, `api/auth.api.ts` | T-03 | Login/register/refresh/2fa chamam API |
| T-06 | Axios interceptor (token header + refresh on 401) | `api/client.ts` | T-05 | Token expirado → refresh automático |
| T-07 | UI primitives: Button, Input, Card, Spinner, Badge, Modal, Toast, Skeleton | `components/ui/` | T-03 | Primitivos renderizam corretamente |
| T-08 | Public layout (centralizado, sem sidebar) | `layouts/public-layout.tsx` | T-03 | Layout renderiza children centralizado |
| T-09 | Login page + validação | `pages/auth/login-page.tsx` | T-05, T-07, T-08 | Login com 2FA pendente redireciona |
| T-10 | Register page + validação | `pages/auth/register-page.tsx` | T-05, T-07, T-08 | Cadastro e redirect para confirmação |
| T-11 | Confirm email page | `pages/auth/confirm-email-page.tsx` | T-05, T-07, T-08 | Token lido da URL → confirma |
| T-12 | 2FA verify page | `pages/auth/two-factor-page.tsx` | T-05, T-07, T-08 | Código TOTP → login completo |

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
| F2 | Login/registro/2FA completam fluxo contra API real |
| F3 | Sidebar navega, rota privada redireciona sem token |
| F4 | Dashboard mostra dados reais (ou mock) |
| F5 | CRUD de pedidos completo |
| F6 | Lista + estorno funcionam |
| F7 | Perfil + 2FA configuráveis |
| F8 | `npm run build` + testes E2E passam |
