import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'
import type { CreateOrderRequest } from '@/types/order'

const ORDERS_KEY = 'orders'

export function useOrdersList(params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: [ORDERS_KEY, params],
    queryFn: () => ordersApi.list(params),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderRequest) => ordersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] })
    },
  })
}
