import { api } from '@lib/api'
import type { Order, OrderStatus, PagedResponse } from '@lib/types/orders.types'
import type { ApiResult } from '@lib/types/api.types'
import type { Product } from '@lib/types/products.types'

interface CreateOrderInput {
  merchantId: string
  items: { product: Product; quantity: number }[]
}

// Backend DTOs — field names differ from frontend Order type
interface BackendItem {
  productId: string
  description: string
  quantity: number
  unitPriceInCents: number
  subtotalInCents: number
}

interface BackendOrder {
  orderId: string
  customerId?: string
  merchantId?: string
  status: OrderStatus
  totalInCents: number
  items: BackendItem[]
  transactionId?: string
  createdAt: string
  updatedAt?: string
  expiresAt: string
}

interface BackendPagedOrders {
  content: BackendOrder[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

function toOrder(b: BackendOrder): Order {
  return {
    id: b.orderId,
    customerId: b.customerId ?? '',
    merchantId: b.merchantId ?? '',
    amountInCents: b.totalInCents,
    currency: 'BRL',
    status: b.status,
    description: b.items?.[0]?.description ?? '',
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? b.createdAt,
    expiresAt: b.expiresAt,
  }
}

interface GetOrdersParams {
  status?: OrderStatus
  page?: number
  size?: number
  sort?: string
}

async function getOrders(params: GetOrdersParams = {}): Promise<ApiResult<PagedResponse<Order>>> {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.page !== undefined) q.set('page', String(params.page))
  if (params.size !== undefined) q.set('size', String(params.size))
  if (params.sort) q.set('sort', params.sort)
  const qs = q.toString()
  const result = await api<BackendPagedOrders>(`/api/v1/orders${qs ? '?' + qs : ''}`)
  if (!result.ok) return result
  return {
    ok: true,
    data: { ...result.data, content: result.data.content.map(toOrder) },
    meta: result.meta,
  }
}

async function getOrderById(id: string): Promise<ApiResult<Order>> {
  const result = await api<BackendOrder>(`/api/v1/orders/${id}`)
  if (!result.ok) return result
  return { ok: true, data: toOrder(result.data), meta: result.meta }
}

async function createOrder(input: CreateOrderInput): Promise<ApiResult<Order>> {
  const backendBody = {
    merchantId: input.merchantId,
    items: input.items.map(({ product, quantity }) => ({
      productId: product.id,
      description: product.name,
      quantity,
      unitPriceInCents: product.priceInCents,
    })),
  }
  const result = await api<BackendOrder>('/api/v1/orders', { method: 'POST', body: backendBody })
  if (!result.ok) return result
  return { ok: true, data: toOrder(result.data), meta: result.meta }
}

async function cancelOrder(id: string): Promise<ApiResult<void>> {
  return api<void>(`/api/v1/orders/${id}`, { method: 'DELETE' })
}

export const ordersService = { getOrders, getOrderById, createOrder, cancelOrder }
