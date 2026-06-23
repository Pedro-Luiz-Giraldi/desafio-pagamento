---
id: plan-003
status: active
links:
  - spec/tech-plans/index.md
  - spec/specs/spec-002-api-layer.md
---
# Tech Plan: API Layer

## Objective
Implementar o wrapper `api()` central com injeção de headers, tratamento de 401/429/timeout e normalização de erros — antes de implementar qualquer feature que faz chamadas HTTP.

## Scope
- In scope: `api.ts`, `useIdempotencyKey` hook, `constants.ts`, normalização de erros, retry on 401
- Out of scope: mocking para testes (cada feature faz seu próprio mock)

## Data Flow
```
Feature chama api('/endpoint', opts) →
  api() monta headers (Authorization, Content-Type, Idempotency-Key se necessário) →
  fetch com AbortController (timeout 10s) →
    200-299 → parse JSON → { ok: true, data, meta }
    401 → refreshToken() → retry UMA VEZ →
      retry 401 → logout() → { ok: false, error: SESSION_EXPIRED }
    429 → { ok: false, error: { errorCode: 'RATE_LIMIT', retryable: true, retryAfterMs } }
    4xx/5xx → { ok: false, error: normalizeError(response) }
    AbortError → { ok: false, error: { errorCode: 'TIMEOUT', retryable: true } }
```

## Implementation Steps

### 1. constants.ts (src/lib/constants.ts)
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const IDEMPOTENT_PATHS = ['/api/v1/orders', '/api/v1/transactions']
```

### 2. useIdempotencyKey (src/shared/hooks/useIdempotencyKey.ts)
```typescript
function useIdempotencyKey(): {
  key: string
  reset(): void   // gera nova key (após sucesso ou erro não-retryável)
}
// Usa crypto.randomUUID() — sem dependência externa
```

### 3. api.ts (src/lib/api.ts)
- Função genérica `api<T>(path, options?): Promise<ApiResult<T>>`
- Lê `accessToken` do AuthContext via `getAccessToken()` (função exportada do context)
- Detecta automaticamente se path precisa de Idempotency-Key
- Normaliza erros do backend (`errors[0]`) para `ApiError`

### 4. Tratamento de erros específicos
```typescript
function normalizeError(response: Response, body: unknown): ApiError {
  const backendError = body?.errors?.[0]
  return {
    errorCode: backendError?.errorCode ?? `HTTP_${response.status}`,
    message: backendError?.message ?? 'Erro inesperado',
    retryable: backendError?.retryable ?? (response.status >= 500),
  }
}
```

## Acceptance Criteria
- Request com token expirado → refresh automático → request reexecutado → resultado correto
- 2 chamadas simultâneas com 401 → apenas 1 refresh acontece (sem race condition)
- Request de POST /orders → header Idempotency-Key presente automaticamente
- Timeout após 10s → `{ ok: false, error: { errorCode: 'TIMEOUT' } }`
- 429 com header `Retry-After: 30` → `{ errorCode: 'RATE_LIMIT', retryAfterMs: 30000 }`
