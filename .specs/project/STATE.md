# STATE — Frontend Merchant Dashboard

**Última atualização:** 2026-06-22
**Sessão ativa:** Onda 2 completa ✅ — Todos os gates passando

---

## Progresso Atual

| Onda | Status | Tasks |
|------|--------|-------|
| **Onda 1 — Fundação** | ✅ Completa | T-01 a T-04 |
| **Onda 2 — Auth** | ✅ Completa | T-05 a T-12 |
| **Onda 3 — App Shell** | ⏳ Pendente | T-13 a T-15 |
| **Onda 4 — Features** | ⏳ Pendente | T-16 a T-24 |
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

