# Feature: App Shell — Authenticated Layout

**Versão:** 1.0  
**Data:** 2026-06-22  
**Marco:** M3 — App Shell  
**Dependências:** M2 — Auth (completo)

---

## Visão Geral

Estrutura de navegação para usuários autenticados: sidebar com menu, topbar com perfil/logout, e proteção de rotas que redireciona usuários não autenticados para `/login`.

## Requisitos Funcionais

### [REQ-AS-01] Authenticated Layout
**Descrição:** Layout com sidebar à esquerda e topbar superior  
**Critérios de Aceitação:**
- Sidebar fixa com logo, menu de navegação e footer
- Topbar com título da página atual e área de usuário
- Área de conteúdo responsiva (360px+)
- Navegação via React Router

**Menu Items:**
| Label | Icon | Path | Disponível no MVP |
|-------|------|----------|---------------|
| Dashboard | 📊 | `/` | ✅ |
| Pedidos | 📦 | `/orders` | ✅ |
| Transações | 💳 | `/transactions` | ✅ |
| Configurações | ⚙️ | `/settings` | ✅ |

### [REQ-AS-02] Protected Route Guard
**Descrição:** HOC que protege rotas autenticadas  
**Critérios de Aceitação:**
- Verifica `useAuthStore().accessToken`
- Se não autenticado → redireciona para `/login`
- Se autenticado → renderiza children
- Preserva URL de destino para redirect pós-login (futuro)

### [REQ-AS-03] Dashboard Home (Placeholder)
**Descrição:** Página inicial com mensagem de boas-vindas  
**Critérios de Aceitação:**
- Exibe nome do usuário logado
- Card com mensagem "Dashboard em construção"
- Usa `AuthenticatedLayout`

### [REQ-AS-04] User Menu (Topbar)
**Descrição:** Dropdown com perfil e logout  
**Critérios de Aceitação:**
- Exibe nome e email do usuário
- Botão "SairhApi.logou" que cht()` e `authStore.clear()`
- Redireciona para `/login` após logout

## Requisitos Não-Funcionais

### [NFR-AS-01] Resama `autponsividade
- Sidebar colapsável em mobile (<768px) — **deferred para pós-MVP**
- Layout funcional em 360px+ (sidebar fixa por enquanto)

### [NFR-AS-02] Acessibilidade
- Navegação por teclado (Tab, Link ativo visualmente destacado
- Contraste WCAG AA

### Enter)
- [NFR-AS-03] Performance
- Sem re-renders desnecessários (React.memo onde aplicável)
- Zustand shallow equality para seletores

## Fora do Escopo (Deferred)

- Sidebar colapsável/responsiva (mobile)
- Breadcrumbs
- Notificações em tempo real
- Modo escuro

## Dependências Técnicas

| Componente | Depende de |
|-----------|-----------|
| `AuthenticatedLayout` | `useAuthStore`, UI primitives |
| `ProtectedRoute` | `useAuthStore`, `react-router-dom` |
| `DashboardPage` | `AuthenticatedLayout`, `useAuthStore` |

## Testes

### Unitários (Vitest + Testing Library)
- `authenticated-layout.test.tsx` — renderização, navegação ativa, logout
- `protected-route.test.tsx` — redirect quando não autenticado, render quando autenticado
- `dashboard-page.test.tsx` — exibe nome do usuário

### E2E (Playwright) — deferred para M8
- Login → Dashboard → Navegação → Logout

## Critérios de Aceitação Global

✅ TypeScript sem erros (`npx tsc -b`)  
✅ ESLint sem warnings (`npm run lint`)  
✅ Build otimizado (`npm run build`)  
✅ Testes unitários passando (`npm test`)  
✅ Cobertura ≥80% nos novos arquivos

---

## Notas de Implementação

**Estrutura de arquivos:**
```
src/
├── layouts/
│   ├── authenticated-layout.tsx
│   └── authenticated-layout.test.tsx
├── components/
│   ├── protected-route.tsx
│   └── protected-route.test.tsx
├── pages/
│   └── dashboard/
│       ├── dashboard-page.tsx
│       └── dashboard-page.test.tsx
└── Appnvalida .tsx (atualizar rotas)
```

**Ícones:** Usar emojis por enquanto (sem biblioteca de ícones no MVP)

**Estado:** `usser` e `accessToken` — reusar

**Logourefresh token no backend)
2. Chamar `authStore.clear()` (limpa estado local)
3. Redirecionar para `/login`
