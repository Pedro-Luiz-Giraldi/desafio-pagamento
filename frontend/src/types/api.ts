export interface ApiResponse<T> {
  data: T
  meta: Meta
  errors: ErrorDetail[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PageMeta
  errors: ErrorDetail[]
}

export interface Meta {
  timestamp: string
  requestId: string
}

export interface PageMeta {
  timestamp: string
  requestId: string
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ErrorDetail {
  code: string
  message: string
  field?: string
  retryable: boolean
}
