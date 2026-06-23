---
id: spec-003
status: active
links:
  - spec/specs/index.md
  - spec/tech-plans/plan-002-auth-system.md
---
# Route Guards

## Context and Primary Objective
- Context: Proteção de rotas do React Router com base em autenticação e role
- Objective: Garantir que usuários não autenticados não acessem rotas protegidas, e que usuários com role errada não acessem rotas restritas

## Functional Requirements (Behavior)
- User story: Como sistema, quero que rotas protegidas redirecionem usuários não autenticados para /login, e rotas de role específica redirecionem usuários com role errada para seu dashboard correto.
- Business rules:
  - `PrivateRoute` verifica apenas `isAuthenticated`
  - `RoleRoute` verifica role específica — se role errada, redireciona para o dashboard da role do usuário (não para /login)
  - Durante `isLoading: true` (refresh silencioso inicial), exibe spinner global — não redireciona
  - Após login, redireciona para a rota que o usuário tentou acessar (saved location)
  - STAFF tem acesso apenas às rotas de leitura — sem rotas de criação ou refund

## Acceptance Criteria (BDD)
- Given usuário não autenticado, when tenta acessar /dashboard, then PrivateRoute redireciona para /login preservando a rota de destino em state
- Given usuário autenticado com role CUSTOMER, when tenta acessar /transactions/:id/refund (MERCHANT_OWNER only), then RoleRoute redireciona para /dashboard
- Given usuário autenticado com role MERCHANT_OWNER, when tenta acessar /orders/new (CUSTOMER only), then RoleRoute redireciona para /dashboard
- Given `isLoading: true`, when qualquer rota protegida é acessada, then exibe spinner global sem redirect
- Given usuário logado, when acessa diretamente /login ou /register, then é redirecionado para /dashboard (não permite ficar em tela de auth logado)
- Given usuário CUSTOMER que tentou acessar /orders/:id antes de logar, when faz login com sucesso, then é redirecionado para /orders/:id (não para /dashboard)

## Interface and Data Contracts
```typescript
// src/router/PrivateRoute.tsx
// Wrapper que verifica isAuthenticated do AuthContext
// Se isLoading → <GlobalSpinner />
// Se !isAuthenticated → <Navigate to="/login" state={{ from: location }} replace />
// Se autenticado → <Outlet />

// src/router/RoleRoute.tsx
// Props: { allowedRoles: UserRole[] }
// Se role não está em allowedRoles → <Navigate to="/dashboard" replace />
// Se está → <Outlet />
```

## Tech Stack and Constraints
- Technologies: React Router v6 (`<Outlet />`, `<Navigate />`, `useLocation`), AuthContext
- Constraints: Sem react-router-dom v5 patterns (sem `<Route component={}>`); usar apenas v6 patterns

## Examples
```tsx
// Roteamento correto:
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route element={<RoleRoute allowedRoles={['MERCHANT_OWNER']} />}>
    <Route path="/transactions/:id/refund" element={<RefundModal />} />
  </Route>
  <Route element={<RoleRoute allowedRoles={['CUSTOMER']} />}>
    <Route path="/orders/new" element={<NewOrder />} />
  </Route>
</Route>
```
