import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService } from '@features/orders/services/ordersService'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@shared/components/DataTable'
import { StatusBadge } from '@shared/components/StatusBadge'
import { ErrorState } from '@shared/components/ErrorState'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import { ROUTES } from '@lib/constants'
import type { Order, OrderStatus } from '@lib/types/orders.types'

const STATUS_OPTIONS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'PAID', label: 'Pago' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'REFUNDED', label: 'Reembolsado' },
  { value: 'PARTIALLY_REFUNDED', label: 'Parcialmente reembolsado' },
]

export default function OrdersListPage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusParam = (searchParams.get('status') as OrderStatus | null) ?? 'ALL'
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)

  const [orders, setOrders] = useState<Order[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    ordersService
      .getOrders({
        status: statusParam !== 'ALL' ? statusParam : undefined,
        page: pageParam,
        size: 10,
        sort: 'createdAt,desc',
      })
      .then(result => {
        if (result.ok) {
          setOrders(result.data.content)
          setTotalPages(result.data.totalPages)
        } else {
          setError(true)
        }
        setLoading(false)
      })
  }, [statusParam, pageParam])

  function handleStatusChange(value: string) {
    setSearchParams(value === 'ALL' ? { page: '0' } : { status: value, page: '0' })
  }

  function handlePageChange(page: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(page))
      return next
    })
  }

  if (error) {
    return <ErrorState onRetry={() => { setError(false); setLoading(true) }} />
  }

  const emptyMessage =
    statusParam !== 'ALL'
      ? `Nenhum pedido com status ${STATUS_OPTIONS.find(o => o.value === statusParam)?.label ?? statusParam}`
      : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        {role === 'CUSTOMER' && (
          <Button asChild size="sm" className="gap-1.5">
            <Link to={ROUTES.NEW_ORDER}>
              <Plus className="h-4 w-4" />
              Novo pedido
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
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
      </div>

      <DataTable
        loading={loading}
        data={orders}
        keyExtractor={o => o.id}
        emptyMessage={emptyMessage}
        page={pageParam}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        columns={[
          {
            key: 'id',
            header: 'ID',
            render: o => (
              <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Data',
            render: o => <span className="text-sm">{formatDate(o.createdAt)}</span>,
          },
          {
            key: 'amount',
            header: 'Valor',
            render: o => <span className="text-sm font-medium">{formatCurrency(o.amountInCents)}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: o => <StatusBadge status={o.status} />,
          },
          {
            key: 'action',
            header: '',
            render: o => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.ORDER_DETAIL.replace(':id', o.id))}
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
