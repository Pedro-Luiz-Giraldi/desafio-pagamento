---
id: spec-001
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-001-login-flow.md
  - spec/tech-plans/plan-002-auth-system.md
---
# AuthContext

## Context and Primary Objective
- Context: Camada de estado global de autenticação do app
- Objective: Prover token de acesso em memória, dados do usuário logado e operações de auth para todas as features

## Functional Requirements (Behavior)
- User story: Como qualquer usuário autenticado, quero que meu estado de sessão persista entre navegações sem precisar logar novamente enquanto o cookie de refresh for válido.
- Business rules:
  - accessToken vive APENAS em memória (variável de estado do AuthContext) — nunca localStorage, sessionStorage ou cookie
  - Cookie `refreshToken` (HttpOnly, 7 dias) é gerenciado exclusivamente pelo backend; o frontend não o lê nem o escreve
  - Na inicialização do app, AuthContext faz POST silencioso para `/auth/refresh` para restaurar sessão
  - Se o refresh retornar 401, o usuário é tratado como deslogado (sem redirect automático — `isAuthenticated: false`)
  - Se o accessToken expirar durante uso (401 em qualquer endpoint protegido), api.ts tenta refresh e reexecuta o request original

## Acceptance Criteria (BDD)
- Given app abre com cookie de refresh válido, when AuthContext inicializa, then `isLoading: true` durante o refresh e `isAuthenticated: true` após sucesso — sem piscar tela de login
- Given app abre sem cookie de refresh, when AuthContext inicializa, then `isLoading: false` e `isAuthenticated: false`
- Given `login(email, password)` chamado com credenciais válidas sem 2FA, when backend retorna 200, then `user`, `role` e `accessToken` em memória são populados; `isAuthenticated: true`
- Given `login()` com 2FA ativo, when backend retorna `twoFactorRequired: true` e `twoFactorToken`, then retorna `{ twoFactorRequired: true, twoFactorToken }` sem popular o estado de auth
- Given `logout()` chamado, when POST /auth/logout retorna 200, then `user`, `role`, `accessToken` são limpos; `isAuthenticated: false`
- Given request retorna 401, when `refreshToken()` é chamado pelo api.ts, then se bem-sucedido atualiza o accessToken em memória; se falhar chama `logout()`

## Interface and Data Contracts
```typescript
interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  twoFactorEnabled: boolean
  emailConfirmed: boolean
}

type UserRole = 'CUSTOMER' | 'MERCHANT_OWNER' | 'STAFF'

type LoginResult =
  | { success: true }
  | { twoFactorRequired: true; twoFactorToken: string }
  | { error: true; errorCode: string; message: string }

interface AuthContextValue {
  user: UserProfile | null
  role: UserRole | null
  accessToken: string | null  // interno, não exposto diretamente — lido pelo api.ts
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<LoginResult>
  logout(): Promise<void>
  refreshToken(): Promise<boolean>
  setTokens(accessToken: string, user: UserProfile): void  // usado pelo 2fa/verify
}
```

## Tech Stack and Constraints
- Technologies: React 18, Context API, TypeScript
- Constraints: Sem Zustand, Redux ou TanStack Query — apenas Context API e fetch nativo

## Examples
- Input: `login('ana@mony.com', 'Senha@123')` → sem 2FA
- Output: `{ user: { id: '...', name: 'Ana', role: 'MERCHANT_OWNER', ... }, isAuthenticated: true }`
- Input: `login('ana@mony.com', 'Senha@123')` → com 2FA
- Output: `{ twoFactorRequired: true, twoFactorToken: 'eyJ...' }` → estado de auth permanece vazio
