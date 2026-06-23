import { api } from '@lib/api'
import type { Order, OrderStatus, CreateOrderRequest, PagedResponse } from '@lib/types/orders.types'
import type { ApiResult } from '@lib/types/api.types'

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
  return api<PagedResponse<Order>>(`/api/v1/orders${qs ? '?' + qs : ''}`)
}

async function getOrderById(id: string): Promise<ApiResult<Order>> {
  return api<Order>(`/api/v1/orders/${id}`)
}

async function createOrder(
  body: CreateOrderRequest
): Promise<ApiResult<Order>> {
  return api<Order>('/api/v1/orders', { method: 'POST', body })
}

async function cancelOrder(id: string): Promise<ApiResult<Order>> {
  return api<Order>(`/api/v1/orders/${id}`, { method: 'DELETE' })
}

export const ordersService = { getOrders, getOrderById, createOrder, cancelOrder }
