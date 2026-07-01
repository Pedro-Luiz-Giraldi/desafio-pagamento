import client from './client'

export interface Product {
  id: string
  merchantId: string
  name: string
  description: string | null
  priceInCents: number
  active: boolean
}

export const productsApi = {
  async listByMerchant(merchantId: string): Promise<Product[]> {
    const response = await client.get<Product[]>('/api/v1/products', {
      params: { merchantId },
    })
    return response.data
  },

  async getById(id: string): Promise<Product> {
    const response = await client.get<Product>(`/api/v1/products/${id}`)
    return response.data
  },
}
