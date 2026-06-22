export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export interface OrderItem {
  productId: string
  description: string
  quantity: number
  unitPriceInCents: number
  subtotalInCents: number
}

export interface Order {
  orderId: string
  status: OrderStatus
  totalInCents: number
  items: OrderItem[]
  expiresAt?: string
  createdAt: string
}

export interface OrderDetail extends Order {
  customerId: string
  merchantId: string
  transactionId?: string
  updatedAt: string
}

export interface CreateOrderRequest {
  merchantId: string
  items: {
    productId: string
    description: string
    quantity: number
    unitPriceInCents: number
  }[]
}
