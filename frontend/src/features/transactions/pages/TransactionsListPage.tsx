import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable } from '@shared/components/DataTable'
import { StatusBadge } from '@shared/components/StatusBadge'
import { ErrorState } from '@shared/components/ErrorState'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import { useDebounce } from '@shared/hooks/useDebounce'
import { ROUTES } from '@lib/constants'
import type { Transaction, TransactionStatus } from '@lib/types/transactions.types'

const STATUS_OPTIONS: { value: TransactionStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'DECLINED', label: 'Recusado' },
  { value: 'SUSPECTED_FRAUD', label: 'Fraude suspeita' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'FULLY_REFUNDED', label: 'Reembolsado' },
  { value: 'PARTIALLY_REFUNDED', label: 'Parcialmente reembolsado' },
]

export default function TransactionsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusParam = (searchParams.get('status') as TransactionStatus | null) ?? 'ALL'
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)

  const [customerIdInput, setCustomerIdInput] = useState(searchParams.get('customerId') ?? '')
  const debouncedCustomerId = useDebounce(customerIdInput, 500)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    transactionsService
      .getTransactions({
        status: statusParam !== 'ALL' ? statusParam : undefined,
        customerId: debouncedCustomerId.trim() || undefined,
        page: pageParam,
        size: 10,
      })
      .then(result => {
        if (result.ok) {
          setTransactions(result.data.content)
          setTotalPages(result.data.totalPages)
        } else {
          setError(true)
        }
        setLoading(false)
      })
  }, [statusParam, debouncedCustomerId, pageParam])

  function handleStatusChange(value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === 'ALL') next.delete('status')
      else next.set('status', value)
      next.set('page', '0')
      return next
    })
  }

  function handlePageChange(page: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(page))
      return next
    })
  }

  if (error) return <ErrorState onRetry={() => { setError(false); setLoading(true) }} />

  const hasFilters = statusParam !== 'ALL' || debouncedCustomerId.trim()
  const emptyMessage = hasFilters
    ? 'Nenhuma transação encontrada para os filtros aplicados'
    : 'Nenhuma transação ainda'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transações</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusParam} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Filtrar por ID do cliente"
          value={customerIdInput}
          onChange={e => setCustomerIdInput(e.target.value)}
          className="w-64"
        />
      </div>

      <DataTable
        loading={loading}
        data={transactions}
        keyExtractor={t => t.transactionId}
        emptyMessage={emptyMessage}
        page={pageParam}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        columns={[
          {
            key: 'createdAt',
            header: 'Data',
            render: t => <span className="text-sm">{formatDate(t.createdAt)}</span>,
          },
          {
            key: 'id',
            header: 'ID',
            render: t => (
              <span className="font-mono text-xs text-muted-foreground">#{t.transactionId.slice(0, 8)}</span>
            ),
          },
          {
            key: 'amount',
            header: 'Valor',
            render: t => <span className="text-sm font-medium">{formatCurrency(t.amountInCents)}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: t => <StatusBadge status={t.status} />,
          },
          {
            key: 'card',
            header: 'Cartão',
            render: t => (
              <span className="font-mono text-xs text-muted-foreground">
                {t.cardBrand && t.cardLastFour ? `${t.cardBrand.toUpperCase()} •••• ${t.cardLastFour}` : '—'}
              </span>
            ),
          },
          {
            key: 'action',
            header: '',
            render: t => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.TRANSACTION_DETAIL.replace(':id', t.transactionId))}
              >
                Ver detalhes
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
