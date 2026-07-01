import client from './client'

export interface MerchantSummary {
  id: string
  companyName: string
  createdAt: string
}

export const merchantsApi = {
  async list(): Promise<MerchantSummary[]> {
    const response = await client.get<MerchantSummary[]>('/api/v1/merchants')
    return response.data
  },

  async getById(id: string): Promise<MerchantSummary> {
    const response = await client.get<MerchantSummary>(`/api/v1/merchants/${id}`)
    return response.data
  },
}
