import { useQuery } from '@tanstack/react-query'
import { merchantsApi } from '@/api/merchants.api'

export function useMerchants() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantsApi.list(),
  })
}

export function useMerchant(id: string) {
  return useQuery({
    queryKey: ['merchant', id],
    queryFn: () => merchantsApi.getById(id),
    enabled: !!id,
  })
}
