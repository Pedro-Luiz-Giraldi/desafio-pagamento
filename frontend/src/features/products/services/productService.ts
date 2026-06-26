import type { Product, CreateProductRequest, UpdateProductRequest } from '@lib/types/products.types'

function storageKey(merchantId: string): string {
  return `aom_products_${merchantId}`
}

function load(merchantId: string): Product[] {
  try {
    const raw = localStorage.getItem(storageKey(merchantId))
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}

function save(merchantId: string, products: Product[]): void {
  localStorage.setItem(storageKey(merchantId), JSON.stringify(products))
}

function getProducts(merchantId: string): Product[] {
  return load(merchantId)
}

function getActiveProducts(merchantId: string): Product[] {
  return load(merchantId).filter(p => p.active)
}

function createProduct(merchantId: string, data: CreateProductRequest): Product {
  const products = load(merchantId)
  const product: Product = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    priceInCents: data.priceInCents,
    active: true,
    createdAt: new Date().toISOString(),
  }
  save(merchantId, [...products, product])
  return product
}

function updateProduct(merchantId: string, id: string, data: UpdateProductRequest): Product | null {
  const products = load(merchantId)
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return null
  const updated = { ...products[idx], ...data }
  products[idx] = updated
  save(merchantId, products)
  return updated
}

function deleteProduct(merchantId: string, id: string): void {
  const products = load(merchantId).filter(p => p.id !== id)
  save(merchantId, products)
}

export const productService = {
  getProducts,
  getActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
