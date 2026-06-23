---
id: spec-002
status: active
links:
  - spec/specs/index.md
  - spec/tech-plans/plan-003-api-layer.md
---
# API Layer (api.ts)

## Context and Primary Objective
- Context: Wrapper central de todas as chamadas HTTP ao backend
- Objective: Garantir que headers obrigatórios sejam injetados, erros tratados uniformemente e o ciclo de refresh/retry aconteça de forma transparente para as features

## Functional Requirements (Behavior)
- User story: Como developer, quero uma função `api()` que encapsula todo o boilerplate de fetch para que as features não precisem se preocupar com auth, headers ou refresh.
- Business rules:
  - Sempre injeta `Content-Type: application/json`
  - Injeta `Authorization: Bearer <accessToken>` se `isAuthenticated: true`
  - Injeta `Idempotency-Key` gerado internamente em POST /orders, POST /transactions e POST /transactions/:id/refund
  - Intercepta resposta 401 → chama `refreshToken()` → reexecuta request original UMA VEZ
  - Se refresh falhar → chama `logout()` e retorna erro
  - Intercepta resposta 429 → retorna erro com `{ errorCode: 'RATE_LIMIT', retryable: true, retryAfterMs }`
  - Toda resposta de erro é normalizada para `ApiError { errorCode, message, retryable }`

## Acceptance Criteria (BDD)
- Given request autenticado, when `api()` é chamado, then header `Authorization: Bearer <token>` é incluído automaticamente
- Given POST /orders, when `api()` processa, then header `Idempotency-Key` (UUID v4) é injetado e retornado ao caller para possível retry
- Given backend retorna 401, when `api()` intercepta, then chama `refreshToken()` e reexecuta o request original com o novo token
- Given refresh retorna 401, when `api()` detecta falha no refresh, then chama `logout()` e rejeita a Promise com `{ errorCode: 'SESSION_EXPIRED' }`
- Given backend retorna 429, when `api()` intercepta, then resolve com `ApiError { errorCode: 'RATE_LIMIT', retryable: true, retryAfterMs: <Retry-After header em ms> }`
- Given backend retorna 500, when `api()` intercepta, then resolve com `ApiError { errorCode: 'INTERNAL_ERROR', retryable: true }`
- Given request com timeout > 10s, when fetch falha por AbortController, then resolve com `ApiError { errorCode: 'TIMEOUT', retryable: true }`

## Interface and Data Contracts
```typescript
interface ApiError {
  errorCode: string
  message: string
  retryable: boolean
}

type ApiResult<T> =
  | { ok: true; data: T; meta: ResponseMeta }
  | { ok: false; error: ApiError }

interface ResponseMeta {
  timestamp: string
  requestId?: string
}

async function api<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    idempotencyKey?: string   // se fornecido, usa este; senão gera automaticamente onde necessário
    signal?: AbortSignal
  }
): Promise<ApiResult<T>>
```

## Tech Stack and Constraints
- Technologies: fetch nativo, TypeScript, AbortController para timeout (10s padrão)
- Constraints: Sem axios, sem bibliotecas de HTTP externas

## Examples
- Input: `api('/api/v1/orders', { method: 'POST', body: { amountInCents: 10000 } })`
- Output (sucesso): `{ ok: true, data: { orderId: 'uuid', status: 'PENDING' }, meta: { timestamp: '...' } }`
- Output (erro): `{ ok: false, error: { errorCode: 'CARD_DECLINED', message: '...', retryable: false } }`
