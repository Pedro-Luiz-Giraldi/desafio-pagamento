import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'

export function useProducts(merchantId: string | null) {
  return useQuery({
    queryKey: ['products', merchantId],
    queryFn: () => productsApi.listByMerchant(merchantId!),
    enabled: !!merchantId,
  })
}
