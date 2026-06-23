export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface Order {
  id: string
  customerId: string
  merchantId: string
  amountInCents: number
  currency: string
  status: OrderStatus
  description: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface CreateOrderRequest {
  amountInCents: number
  currency: string
  description: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
