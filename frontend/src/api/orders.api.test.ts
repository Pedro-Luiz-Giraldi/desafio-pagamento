import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { ordersApi } from './orders.api'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedClient = vi.mocked(client)

describe('ordersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists orders with pagination', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } } })
    const result = await ordersApi.list({ page: 0, size: 20 })
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders', { params: { page: 0, size: 20 } })
    expect(result.data).toEqual([])
  })

  it('lists orders with status filter', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } } })
    await ordersApi.list({ status: 'PENDING' })
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders', { params: { status: 'PENDING' } })
  })

  it('gets order by id', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: { orderId: 'ord-1' } } })
    const result = await ordersApi.getById('ord-1')
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders/ord-1')
    expect(result.data.orderId).toBe('ord-1')
  })

  it('creates order with items', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { data: { orderId: 'ord-1' } } })
    const input = { merchantId: 'm-1', items: [{ productId: 'p-1', description: 'Item 1', quantity: 2, unitPriceInCents: 1000 }] }
    const result = await ordersApi.create(input)
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/orders', input)
    expect(result.data.orderId).toBe('ord-1')
  })

  it('cancels order', async () => {
    mockedClient.delete.mockResolvedValueOnce({})
    await ordersApi.cancel('ord-1')
    expect(mockedClient.delete).toHaveBeenCalledWith('/api/v1/orders/ord-1')
  })
})
