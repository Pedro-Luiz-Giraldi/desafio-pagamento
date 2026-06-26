import { v4 as uuidv4 } from 'uuid'
import client from './client'
import type { Order, OrderDetail, CreateOrderRequest } from '@/types/order'
import type { PaginatedResponse, ApiResponse } from '@/types/api'

export const ordersApi = {
  async list(params?: { page?: number; size?: number; status?: string }): Promise<PaginatedResponse<Order>> {
    const response = await client.get<PaginatedResponse<Order>>('/api/v1/orders', { params })
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<OrderDetail>> {
    const response = await client.get<ApiResponse<OrderDetail>>(`/api/v1/orders/${id}`)
    return response.data
  },

  async create(input: CreateOrderRequest): Promise<ApiResponse<OrderDetail>> {
    const idempotencyKey = uuidv4()
    const response = await client.post<ApiResponse<OrderDetail>>('/api/v1/orders', input, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
    return response.data
  },

  async cancel(id: string): Promise<void> {
    await client.delete(`/api/v1/orders/${id}`)
  },
}
