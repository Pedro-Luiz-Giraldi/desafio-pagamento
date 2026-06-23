export interface ApiError {
  errorCode: string
  message: string
  retryable: boolean
  retryAfterMs?: number
}

export interface ResponseMeta {
  timestamp: string
  requestId?: string
}

export type ApiResult<T> =
  | { ok: true; data: T; meta: ResponseMeta }
  | { ok: false; error: ApiError }
