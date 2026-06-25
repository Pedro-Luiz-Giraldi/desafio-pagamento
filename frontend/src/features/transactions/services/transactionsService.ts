import { api } from '@lib/api'
import type {
  Transaction,
  TransactionDetail,
  TransactionStatus,
  Refund,
  CreateTransactionRequest,
  CreateRefundRequest,
} from '@lib/types/transactions.types'
import type { PagedResponse } from '@lib/types/orders.types'
import type { ApiResult } from '@lib/types/api.types'

interface GetTransactionsParams {
  status?: TransactionStatus
  customerId?: string
  page?: number
  size?: number
}

async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<ApiResult<PagedResponse<Transaction>>> {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.customerId) q.set('customerId', params.customerId)
  if (params.page !== undefined) q.set('page', String(params.page))
  if (params.size !== undefined) q.set('size', String(params.size))
  const qs = q.toString()
  return api<PagedResponse<Transaction>>(`/api/v1/transactions${qs ? '?' + qs : ''}`)
}

async function getTransactionById(id: string): Promise<ApiResult<TransactionDetail>> {
  const result = await api<Record<string, unknown>>(`/api/v1/transactions/${id}`)
  if (!result.ok) return result

  const raw = result.data
  const refunds = (raw.refunds as Array<{ amountInCents?: number; processedAt?: string }>) ?? []
  const totalRefundedInCents = refunds.reduce((sum, r) => sum + (r.amountInCents ?? 0), 0)
  const availableForRefundInCents = ((raw.amountInCents as number) ?? 0) - totalRefundedInCents

  const normalizedRefunds = refunds.map(r => ({
    ...r,
    createdAt: (r as Record<string, unknown>).createdAt ?? r.processedAt ?? '',
  }))

  return {
    ok: true,
    meta: result.meta,
    data: {
      ...(raw as object),
      refunds: normalizedRefunds,
      totalRefundedInCents,
      availableForRefundInCents,
    } as TransactionDetail,
  }
}

async function createTransaction(
  body: CreateTransactionRequest
): Promise<ApiResult<Transaction>> {
  return api<Transaction>('/api/v1/transactions', { method: 'POST', body })
}

async function getRefunds(transactionId: string): Promise<ApiResult<Refund[]>> {
  return api<Refund[]>(`/api/v1/transactions/${transactionId}/refunds`)
}

async function createRefund(
  transactionId: string,
  body: CreateRefundRequest,
  idempotencyKey?: string
): Promise<ApiResult<Refund>> {
  return api<Refund>(`/api/v1/transactions/${transactionId}/refund`, {
    method: 'POST',
    body,
    idempotencyKey,
  })
}

export const transactionsService = {
  getTransactions,
  getTransactionById,
  createTransaction,
  getRefunds,
  createRefund,
}
