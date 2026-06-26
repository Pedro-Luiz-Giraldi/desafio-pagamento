import { API_BASE_URL, IDEMPOTENT_PATHS } from './constants'
import { authRef } from './authRef'
import type { ApiError, ApiResult, ResponseMeta } from './types/api.types'

const TIMEOUT_MS = 10_000

// Prevents concurrent refresh calls causing multiple /auth/refresh requests
let inflightRefresh: Promise<boolean> | null = null

function needsIdempotencyKey(path: string, method: string): boolean {
  return (
    method === 'POST' &&
    IDEMPOTENT_PATHS.some(p => path.startsWith(p))
  )
}

function normalizeError(status: number, body: unknown): ApiError {
  const b = body as Record<string, unknown> | null
  // Standard paginated error format: { errors: [{ errorCode, message, retryable }] }
  const err = b?.errors
  const first = Array.isArray(err) ? (err[0] as Record<string, unknown>) : null
  return {
    errorCode: (first?.errorCode as string) ?? (b?.errorCode as string) ?? `HTTP_${status}`,
    message: (first?.message as string) ?? (b?.detail as string) ?? (b?.message as string) ?? 'Erro inesperado',
    retryable: (first?.retryable as boolean) ?? (b?.retryable as boolean) ?? status >= 500,
  }
}

async function executeRequest(
  path: string,
  method: string,
  body: unknown,
  token: string | null,
  idempotencyKey?: string,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (needsIdempotencyKey(path, method)) {
    headers['Idempotency-Key'] = idempotencyKey ?? crypto.randomUUID()
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    return {
      ok: false,
      error: {
        errorCode: 'RATE_LIMIT',
        message: 'Muitas requisições. Tente novamente em instantes.',
        retryable: true,
        retryAfterMs: retryAfter ? parseInt(retryAfter) * 1000 : 30_000,
      },
    }
  }

  const contentLength = response.headers.get('content-length')
  const hasBody = contentLength !== '0' && response.status !== 204
  const responseBody = hasBody ? await response.json().catch(() => null) : null

  if (!response.ok) {
    return { ok: false, error: normalizeError(response.status, responseBody) }
  }

  const data: T = responseBody?.data ?? responseBody
  const meta: ResponseMeta = responseBody?.meta ?? { timestamp: new Date().toISOString() }
  return { ok: true, data, meta }
}

export async function api<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    idempotencyKey?: string
    signal?: AbortSignal
  } = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, idempotencyKey, signal } = options

  let response: Response
  try {
    response = await executeRequest(path, method, body, authRef.getToken(), idempotencyKey, signal)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: { errorCode: 'TIMEOUT', message: 'A requisição demorou muito. Tente novamente.', retryable: true },
      }
    }
    return {
      ok: false,
      error: { errorCode: 'NETWORK_ERROR', message: 'Erro de conexão. Verifique sua internet.', retryable: true },
    }
  }

  // 401: attempt one token refresh then retry
  if (response.status === 401) {
    if (!inflightRefresh) {
      inflightRefresh = authRef.refresh().finally(() => { inflightRefresh = null })
    }
    const refreshed = await inflightRefresh

    if (!refreshed) {
      await authRef.logout()
      return {
        ok: false,
        error: { errorCode: 'SESSION_EXPIRED', message: 'Sua sessão expirou. Faça login novamente.', retryable: false },
      }
    }

    try {
      const retryResponse = await executeRequest(path, method, body, authRef.getToken(), idempotencyKey, signal)
      if (retryResponse.status === 401) {
        await authRef.logout()
        return {
          ok: false,
          error: { errorCode: 'SESSION_EXPIRED', message: 'Sua sessão expirou. Faça login novamente.', retryable: false },
        }
      }
      return parseResponse<T>(retryResponse)
    } catch {
      return {
        ok: false,
        error: { errorCode: 'NETWORK_ERROR', message: 'Erro de conexão. Verifique sua internet.', retryable: true },
      }
    }
  }

  return parseResponse<T>(response)
}
