import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, ShoppingBag, XCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService } from '@features/orders/services/ordersService'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@shared/components/StatusBadge'
import { ErrorState } from '@shared/components/ErrorState'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import type { Order } from '@lib/types/orders.types'
import type { Transaction } from '@lib/types/transactions.types'
import { ROUTES } from '@lib/constants'

// ─── Customer Dashboard ─────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon: Icon,
  loading,
  onClick,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  loading: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CustomerDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    ordersService.getOrders({ size: 50 }).then(result => {
      if (result.ok) setOrders(result.data.content)
      else setError(true)
      setLoading(false)
    })
  }, [])

  if (error) return <ErrorState onRetry={() => { setError(false); setLoading(true) }} />

  const pending = orders.filter(o => o.status === 'PENDING').length
  const paid = orders.filter(o => o.status === 'PAID').length
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length
  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link to={ROUTES.NEW_ORDER}>
            <Plus className="h-4 w-4" />
            Criar pedido
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Pedidos pendentes"
          value={pending}
          icon={ShoppingBag}
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=PENDING`)}
        />
        <MetricCard
          title="Pedidos pagos"
          value={paid}
          icon={CheckCircle}
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=PAID`)}
        />
        <MetricCard
          title="Pedidos cancelados"
          value={cancelled}
          icon={XCircle}
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=CANCELLED`)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Últimos pedidos</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.ORDERS}>Ver todos</Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            Você ainda não tem pedidos.
          </div>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {recent.map(order => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatCurrency(order.amountInCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Merchant Dashboard ──────────────────────────────────────────────────────

function MerchantDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    transactionsService.getTransactions({ size: 50 }).then(result => {
      if (result.ok) setTransactions(result.data.content)
      else setError(true)
      setLoadingTx(false)
    })
    ordersService.getOrders({ size: 5 }).then(result => {
      if (result.ok) setOrders(result.data.content)
      setLoadingOrders(false)
    })
  }, [])

  if (error) return <ErrorState />

  const loading = loadingTx

  const totalSales = transactions.filter(t =>
    ['APPROVED', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED'].includes(t.status)
  ).length

  const revenueInCents = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amountInCents, 0)

  const approvalRate =
    transactions.length > 0
      ? Math.round((transactions.filter(t => t.status === 'APPROVED').length / transactions.length) * 100)
      : null

  const recentTx = transactions.slice(0, 5)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Total de vendas"
          value={totalSales}
          icon={ShoppingBag}
          loading={loading}
        />
        <MetricCard
          title="Receita total"
          value={formatCurrency(revenueInCents)}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Taxa de aprovação"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          icon={CheckCircle}
          loading={loading}
        />
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Últimas transações</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.TRANSACTIONS}>Ver todas</Link>
          </Button>
        </div>

        {loadingTx ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : recentTx.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {recentTx.map(tx => (
              <Link
                key={tx.id}
                to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatCurrency(tx.amountInCents)}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{tx.id.slice(0, 8)} · {formatDate(tx.createdAt)}
                  </p>
                </div>
                <StatusBadge status={tx.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pedidos recentes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.ORDERS}>Ver todos</Link>
          </Button>
        </div>

        {loadingOrders ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {orders.map(order => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatCurrency(order.amountInCents)}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{order.id.slice(0, 8)} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useAuth()
  if (role === 'MERCHANT_OWNER' || role === 'STAFF') return <MerchantDashboard />
  return <CustomerDashboard />
}
