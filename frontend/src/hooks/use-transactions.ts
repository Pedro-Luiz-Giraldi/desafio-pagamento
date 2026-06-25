import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions.api'
import type { RefundRequest } from '@/types/transaction'

const TRANSACTIONS_KEY = 'transactions'

export function useTransactionsList(params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, params],
    queryFn: () => transactionsApi.list(params),
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, id],
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  })
}

export function useRefundTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RefundRequest }) => transactionsApi.refund(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })
}
