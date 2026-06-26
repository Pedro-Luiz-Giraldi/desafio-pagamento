export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  active: boolean
  createdAt: string
}

export interface CreateProductRequest {
  name: string
  description: string
  priceInCents: number
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  priceInCents?: number
  active?: boolean
}
