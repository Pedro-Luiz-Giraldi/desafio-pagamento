import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService } from '@features/orders/services/ordersService'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@shared/components/StatusBadge'
import { ErrorState } from '@shared/components/ErrorState'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import type { Order } from '@lib/types/orders.types'
import type { Transaction } from '@lib/types/transactions.types'
import { ROUTES } from '@lib/constants'

// ─── Customer Dashboard ──────────────────────────────────────────────────────

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
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <CustomerMetricCard
          label="Pedidos pendentes"
          value={pending}
          icon={ShoppingBag}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=PENDING`)}
        />
        <CustomerMetricCard
          label="Pedidos pagos"
          value={paid}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=PAID`)}
        />
        <CustomerMetricCard
          label="Pedidos cancelados"
          value={cancelled}
          icon={XCircle}
          iconColor="text-slate-400"
          iconBg="bg-slate-100"
          loading={loading}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=CANCELLED`)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Últimos pedidos</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <Link to={ROUTES.ORDERS}>
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Acesse um link de checkout para fazer sua primeira compra.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {recent.map(order => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">{formatCurrency(order.amountInCents)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
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

function CustomerMetricCard({
  label, value, icon: Icon, iconColor, iconBg, loading, onClick,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  loading: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-foreground">{value}</p>
      )}
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </button>
  )
}

// ─── Merchant Dashboard ───────────────────────────────────────────────────────

function MerchantDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('all')

  useEffect(() => {
    transactionsService.getTransactions({ size: 100 }).then(result => {
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

  const approved = transactions.filter(t => t.status === 'APPROVED')
  const partiallyRefunded = transactions.filter(t => t.status === 'PARTIALLY_REFUNDED')
  const fullyRefunded = transactions.filter(t => t.status === 'FULLY_REFUNDED')
  const declined = transactions.filter(t => t.status === 'DECLINED' || t.status === 'SUSPECTED_FRAUD')
  const refunded = [...partiallyRefunded, ...fullyRefunded]

  const totalSales = approved.length + refunded.length
  // FULLY_REFUNDED: valor líquido = 0 (não entra no cálculo)
  // PARTIALLY_REFUNDED: valor líquido = original - já reembolsado
  const revenueInCents =
    approved.reduce((s, t) => s + t.amountInCents, 0) +
    partiallyRefunded.reduce((s, t) => s + t.amountInCents - (t.refundedAmountInCents ?? 0), 0)
  const approvalRate = transactions.length > 0
    ? Math.round(((approved.length + refunded.length) / transactions.length) * 100)
    : null
  const refundRate = totalSales > 0
    ? Math.round((refunded.length / totalSales) * 100)
    : null
  const declineRate = transactions.length > 0
    ? Math.round((declined.length / transactions.length) * 100)
    : null
  const recentTx = transactions.slice(0, 5)

  const PERIODS = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'all', label: 'Total' },
  ] as const

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-4">
        <PrimaryMetricCard
          label="Valor líquido"
          value={loading ? null : formatCurrency(revenueInCents)}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={approved.length > 0 ? `${approved.length} transaç${approved.length === 1 ? 'ão' : 'ões'} aprovada${approved.length === 1 ? '' : 's'}` : undefined}
        />
        <PrimaryMetricCard
          label="Vendas"
          value={loading ? null : String(totalSales)}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={transactions.length > 0 ? `${transactions.length} transaç${transactions.length === 1 ? 'ão' : 'ões'} no total` : undefined}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-4 gap-4">
        <GatewayMetricCard
          label="Aprovação cartão"
          value={loading ? null : approvalRate !== null ? `${approvalRate}%` : '—'}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          positive={approvalRate !== null && approvalRate >= 90}
        />
        <GatewayMetricCard
          label="Reembolso"
          value={loading ? null : refundRate !== null ? `${refundRate}%` : '0%'}
          icon={RotateCcw}
          iconColor="text-orange-500"
          positive={refundRate === null || refundRate === 0}
        />
        <GatewayMetricCard
          label="Chargeback"
          value={loading ? null : '0%'}
          icon={AlertTriangle}
          iconColor="text-red-500"
          positive
        />
        <GatewayMetricCard
          label="Recusadas"
          value={loading ? null : declineRate !== null ? `${declineRate}%` : '—'}
          icon={XCircle}
          iconColor="text-slate-400"
          positive={declineRate === null || declineRate === 0}
        />
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Últimas transações</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <Link to={ROUTES.TRANSACTIONS}>
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loadingTx ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <CreditIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Compartilhe um link de checkout com seus clientes para começar.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {recentTx.map(tx => (
              <Link
                key={tx.transactionId}
                to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.transactionId)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs flex-none ${
                    tx.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : tx.status === 'DECLINED' || tx.status === 'SUSPECTED_FRAUD'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tx.status === 'APPROVED' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : tx.status === 'DECLINED' || tx.status === 'SUSPECTED_FRAUD' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatCurrency(tx.amountInCents)}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      #{tx.transactionId.slice(0, 8)} · {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      {!loadingOrders && orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Pedidos recentes</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              <Link to={ROUTES.ORDERS}>
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {orders.map(order => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">{formatCurrency(order.amountInCents)}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{order.id.slice(0, 8)} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PrimaryMetricCard({
  label, value, icon: Icon, iconColor, iconBg, trend,
}: {
  label: string
  value: string | null
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trend?: string
}) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-9 w-32 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-foreground">{value}</p>
      )}
      {trend && <p className="text-xs text-muted-foreground mt-1.5">{trend}</p>}
    </div>
  )
}

function GatewayMetricCard({
  label, value, icon: Icon, iconColor, positive,
}: {
  label: string
  value: string | null
  icon: React.ElementType
  iconColor: string
  positive?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className={`text-2xl font-bold ${positive ? 'text-foreground' : 'text-destructive'}`}>
          {value}
        </p>
      )}
    </div>
  )
}

function CreditIcon({ className }: { className?: string }) {
  return <CreditCard className={className} />
}

import { CreditCard } from 'lucide-react'

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useAuth()
  if (role === 'MERCHANT_OWNER' || role === 'STAFF') return <MerchantDashboard />
  return <CustomerDashboard />
}
