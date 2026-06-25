import { useAuthStore } from '@/stores/auth.store'
import { useOrdersList } from '@/hooks/use-orders'
import { useTransactionsList } from '@/hooks/use-transactions'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { formatCents, formatDate } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: pendingOrders, isLoading: loadingOrders } = useOrdersList({ status: 'PENDING', size: 5 })
  const { data: recentTxns, isLoading: loadingTxns } = useTransactionsList({ size: 5 })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.fullName || 'Merchant'}!
        </h2>
        <p className="text-gray-600 mt-1">
          Gerencie seus pagamentos e pedidos em um só lugar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>📦 Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{pendingOrders?.meta.totalElements ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTxns ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{recentTxns?.meta.totalElements ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/orders/new')}>Novo Pedido</Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/transactions')}>Ver Transações</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📦 Últimos Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : !pendingOrders?.data.length ? (
              <p className="text-sm text-gray-500">Nenhum pedido pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.data.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-2 -mx-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.items.length} item(ns)</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCents(order.totalInCents)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTxns ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : !recentTxns?.data.length ? (
              <p className="text-sm text-gray-500">Nenhuma transação recente</p>
            ) : (
              <div className="space-y-3">
                {recentTxns.data.map((txn) => (
                  <div
                    key={txn.transactionId}
                    onClick={() => navigate(`/transactions/${txn.transactionId}`)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-2 -mx-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : 'Transação'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCents(txn.amountInCents)}</p>
                      <StatusBadge status={txn.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
