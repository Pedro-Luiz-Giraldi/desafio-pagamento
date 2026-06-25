# Tasks: Finalização

**Feature:** finalization
**Status:** 🚧 Em Progresso

---

## Task Breakdown

### T-25: Página 404 [P]
**Requisito:** REQ-FIN-001
**Estimativa:** 30min
**Status:** ✅ Completo

**O que fazer:**
1. Criar `src/pages/not-found-page.tsx`
2. Adicionar rota catch-all (`path="*"`) no `App.tsx`
3. Design: mensagem amigável, ilustração/emoji, botão "Voltar à Home"
4. Criar teste `src/pages/not-found-page.test.tsx`

**Onde:**
- `frontend/src/pages/not-found-page.tsx`
- `frontend/src/pages/not-found-page.test.tsx`
- `frontend/src/App.tsx`

**Depende de:** —

**Reusa:** `Button`, `Card` (UI components)

**Feito quando:**
- Rota `*` redireciona para NotFoundPage
- Página exibe mensagem e botão funcional
- Teste verifica renderização e navegação

**Testes:** Unit (Vitest + Testing Library)

**Gate:** `npm test` passa

---

### T-26: Responsividade Mobile [P]
**Requisito:** REQ-FIN-002
**Estimativa:** 2-3h
**Status:** ✅ Completo

**O que fazer:**
1. **Sidebar Mobile:**
   - Adicionar estado `mobileMenuOpen` no `AuthenticatedLayout`
   - Botão hamburguer na topbar (visível apenas em mobile)
   - Sidebar overlay em mobile (fixed, z-50, backdrop)
   - Fechar ao clicar em link ou backdrop
2. **Tabelas Responsivas:**
   - `OrdersListPage`: Cards em mobile, tabela em desktop
   - `TransactionsListPage`: Cards em mobile, tabela em desktop
3. **Formulários:**
   - `OrderCreatePage`: Grid responsivo (1 col em mobile, 2 em desktop)
   - `TwoFactorSetupPage`: QR code centralizado, texto adaptado
4. **Breakpoints Tailwind:**
   - Mobile: < 768px
   - Tablet: 768px - 1024px
   - Desktop: > 1024px

**Onde:**
- `frontend/src/layouts/authenticated-layout.tsx`
- `frontend/src/pages/orders/orders-list-page.tsx`
- `frontend/src/pages/transactions/transactions-list-page.tsx`
- `frontend/src/pages/orders/order-create-page.tsx`

**Depende de:** —

**Reusa:** Tailwind breakpoints (`sm:`, `md:`, `lg:`)

**Feito quando:**
- Sidebar funciona em mobile (hamburguer + overlay)
- Tabelas exibem cards em mobile
- Formulários adaptam layout em mobile
- Testado manualmente em 360px, 768px, 1024px

**Testes:** Manual (browser DevTools)

**Gate:** Visual check em múltiplos breakpoints

---

### T-27: Playwright E2E Setup + Smoke Tests [P]
**Requisito:** REQ-FIN-003
**Estimativa:** 3-4h
**Status:** ✅ Completo

**O que fazer:**
1. **Setup:**
   - `npm install -D @playwright/test`
   - Criar `playwright.config.ts` (baseURL: http://localhost:5173)
   - Criar `tests/e2e/` directory
   - Adicionar scripts no `package.json`: `test:e2e`, `test:e2e:ui`
2. **Smoke Tests:**
   - `tests/e2e/auth.spec.ts`: Login flow (mock ou test user)
   - `tests/e2e/orders.spec.ts`: Criar pedido, visualizar lista
   - `tests/e2e/transactions.spec.ts`: Visualizar lista de transações
   - `tests/e2e/404.spec.ts`: Rota inválida exibe 404
3. **Fixtures (opcional):**
   - Mock de API responses para testes isolados
   - Ou usar backend real em ambiente de teste

**Onde:**
- `frontend/playwright.config.ts`
- `frontend/tests/e2e/auth.spec.ts`
- `frontend/tests/e2e/orders.spec.ts`
- `frontend/tests/e2e/transactions.spec.ts`
- `frontend/tests/e2e/404.spec.ts`
- `frontend/package.json`

**Depende de:** T-25 (404 page)

**Reusa:** Playwright test runner

**Feito quando:**
- Playwright configurado e executando
- 4 smoke tests criados e passando
- Scripts `test:e2e` e `test:e2e:ui` funcionais

**Testes:** E2E (Playwright)

**Gate:** `npm run test:e2e` passa

---

## Execution Plan

**Parallel Wave:**
- T-25, T-26, T-27 podem ser executados em paralelo (marcados com `[P]`)

**Ordem sugerida:**
1. T-25 (404) — Rápido, independente
2. T-26 (Responsividade) — Crítico para MVP
3. T-27 (E2E) — Pode ser simplificado se tempo for curto

---

## Gates Finais (Onda 5)

| Gate | Comando | Critério-------|
| Typ |
|------|---------|---eScript | `npx tsc -b` | Zero erros |
| Lint | `npm run lint` | Zero erros/warnings |
| Unit Tests | `npm test` | Todos passando |
| Build | `npm run build` | Build bem-sucedido |
| E2E Tests | `npm run test:e2e` | Smoke tests passando |
| Responsividade | Manual | 360px, 768px, 1024px OK |

---

## Notas

- **T-27 (E2E)** pode ser simplificado para apenas 2-3 smoke tests se tempo for limitado
- **Responsividade** é mais crítica que E2E para MVP
- Considerar adicionar `test:e2e:headed` para debug visual
