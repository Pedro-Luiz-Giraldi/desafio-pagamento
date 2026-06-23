---
id: plan-002
status: active
links:
  - spec/tech-plans/index.md
  - spec/specs/spec-001-auth-context.md
  - spec/specs/spec-003-route-guards.md
  - spec/adrs/adr-002-context-api.md
  - spec/adrs/adr-003-token-em-memoria.md
---
# Tech Plan: Auth System

## Objective
Implementar AuthContext, route guards e os arquivos de serviço de auth antes de qualquer tela.
Este plano é pré-requisito para todos os outros planos.

## Scope
- In scope: AuthContext, PrivateRoute, RoleRoute, authService.ts, tipos de auth, refresh silencioso na inicialização
- Out of scope: telas de login/register/2FA (plan-003 e features/auth)

## Data Flow
```
App init → AuthContext.init() → POST /auth/refresh →
  se 200 → setTokens(accessToken, user) → isAuthenticated: true
  se 401 → isAuthenticated: false

Login → authService.login() → POST /auth/login →
  se success → setTokens() → isAuthenticated: true
  se 2FA → retorna { twoFactorRequired, twoFactorToken }

401 em qualquer request → api.ts → refreshToken() →
  se 200 → retry original
  se 401 → logout() → redirect /login
```

## Implementation Steps

### 1. Tipos (src/lib/types/auth.types.ts)
Todos os tipos do spec-001: `UserProfile`, `UserRole`, `LoginResult`, `AuthContextValue`

### 2. authService.ts (src/features/auth/services/authService.ts)
```typescript
login(email, password): Promise<LoginResult>
logout(): Promise<void>
refreshToken(): Promise<{ accessToken: string; user: UserProfile } | null>
verify2FA(code, twoFactorToken): Promise<LoginResult>
```
Cada método chama `api()` e mapeia o resultado.

### 3. AuthContext (src/contexts/AuthContext.tsx)
- Estado: `{ user, role, accessToken, isAuthenticated, isLoading }`
- `useEffect` na montagem chama `refreshToken()` silenciosamente
- Expõe `login`, `logout`, `refreshToken`, `setTokens`

### 4. Route Guards
- `PrivateRoute.tsx`: verifica `isLoading` → spinner; verifica `isAuthenticated` → redirect ou Outlet
- `RoleRoute.tsx`: props `allowedRoles`; verifica `role` → redirect ou Outlet

### 5. Router (src/router/index.tsx)
Estrutura completa de rotas conforme ARCHITECTURE.md, com todos os guards aplicados.

## Acceptance Criteria
- App com cookie válido → usuário permanece logado após F5 (refresh silencioso funciona)
- App sem cookie → tela de login exibida
- Rota protegida acessada sem auth → redirect para /login com `state.from`
- Rota de MERCHANT_OWNER acessada por CUSTOMER → redirect para /dashboard
- Token nunca aparece no localStorage (verificar pelo DevTools)
