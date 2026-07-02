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
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0A2540]">
            {user?.fullName || 'Merchant'}
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs">
            Visão geral dos seus pagamentos e pedidos
          </p>
        </div>
        {user?.role === 'CUSTOMER' && (
          <Button size="sm" onClick={() => navigate('/orders/new')}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pedido
          </Button>
        )}
      </div>

      {/* Metrics Row - More Compact */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendentes</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {loadingOrders ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-2xl font-bold text-[#0A2540] tabular-nums">{pendingOrders?.meta.totalElements ?? 0}</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transações</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          {loadingTxns ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-2xl font-bold text-[#0A2540] tabular-nums">{recentTxns?.meta.totalElements ?? 0}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#0A2540] to-[#1A56DB] rounded-lg p-4 text-white col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">Ações Rápidas</p>
              <div className="flex gap-2 mt-2">
                {user?.role === 'CUSTOMER' && (
                  <button 
                    onClick={() => navigate('/orders/new')}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  >
                    Novo Pedido
                  </button>
                )}
                <button 
                  onClick={() => navigate('/transactions')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                >
                  Ver Transações
                </button>
              </div>
            </div>
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Activity Feed - Single Column, More Compact */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Atividade Recente</CardTitle>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/orders')}
                className="text-xs text-slate-600 hover:text-[#1A56DB] font-medium transition-colors"
              >
                Ver todos pedidos →
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingOrders || loadingTxns ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Combine orders and transactions into single feed */}
              {pendingOrders?.data.slice(0, 3).map((order) => (
                <div
                  key={`order-${order.orderId}`}
                  onClick={() => navigate(`/orders/${order.orderId}`)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-md p-2 -mx-2 transition-all group"
                >
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      Pedido • {order.items.length} item(ns)
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0A2540] tabular-nums">{formatCents(order.totalInCents)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
              
              {recentTxns?.data.slice(0, 3).map((txn) => (
                <div
                  key={`txn-${txn.transactionId}`}
                  onClick={() => navigate(`/transactions/${txn.transactionId}`)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-md p-2 -mx-2 transition-all group"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : 'Transação'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(txn.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0A2540] tabular-nums">{formatCents(txn.amountInCents)}</p>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              ))}
              
              {!pendingOrders?.data.length && !recentTxns?.data.length && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-slate-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
