import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { transactionsApi } from './transactions.api'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedClient = vi.mocked(client)

describe('transactionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists transactions with pagination', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } } })
    const result = await transactionsApi.list({ page: 0, size: 20 })
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/transactions', { params: { page: 0, size: 20 } })
    expect(result.data).toEqual([])
  })

  it('lists transactions with status filter', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } } })
    await transactionsApi.list({ status: 'APPROVED' })
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/transactions', { params: { status: 'APPROVED' } })
  })

  it('gets transaction by id', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: { transactionId: 'txn-1' } } })
    const result = await transactionsApi.getById('txn-1')
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/transactions/txn-1')
    expect(result.data.transactionId).toBe('txn-1')
  })

  it('processes refund', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { data: { transactionId: 'txn-1' } } })
    const input = { amountInCents: 1000, reason: 'CUSTOMER_REQUEST' as const, requestedBy: 'merchant' }
    const result = await transactionsApi.refund('txn-1', input)
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/transactions/txn-1/refund', input)
    expect(result.data.transactionId).toBe('txn-1')
  })
})
