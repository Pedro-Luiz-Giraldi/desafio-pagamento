import client from './client'
import type { Transaction, TransactionDetail, RefundRequest } from '@/types/transaction'
import type { PaginatedResponse, ApiResponse } from '@/types/api'

export const transactionsApi = {
  async list(params?: { page?: number; size?: number; status?: string }): Promise<PaginatedResponse<Transaction>> {
    const response = await client.get<PaginatedResponse<Transaction>>('/api/v1/transactions', { params })
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<TransactionDetail>> {
    const response = await client.get<ApiResponse<TransactionDetail>>(`/api/v1/transactions/${id}`)
    return response.data
  },

  async refund(id: string, input: RefundRequest): Promise<ApiResponse<TransactionDetail>> {
    const response = await client.post<ApiResponse<TransactionDetail>>(`/api/v1/transactions/${id}/refund`, input)
    return response.data
  },
}
