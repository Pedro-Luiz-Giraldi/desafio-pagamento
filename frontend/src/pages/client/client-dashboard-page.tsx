import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useOrdersList } from '@/hooks/use-orders'
import { useTransactionsList } from '@/hooks/use-transactions'

export function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.userId

  const { data: ordersPage } = useOrdersList({ customerId: userId, page: 0, size: 5 })
  const { data: transactionsPage } = useTransactionsList({ customerId: userId, page: 0, size: 5 })

  const orders = ordersPage?.data ?? []
  const pendingOrders = orders.filter((o: any) => o.status === 'PENDING')
  const transactions = transactionsPage?.data ?? []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ola, {user?.fullName || 'Cliente'}</h1>
        <p className="text-sm text-gray-500 mt-1">Bem-vindo ao seu painel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total de Pedidos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Pedidos Pendentes</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingOrders.length}</p>
          {pendingOrders.length > 0 && (
            <Link to="/orders" className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
              Pagar agora &rarr;
            </Link>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Transacoes Recentes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{transactions.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          to="/orders/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Novo Pedido
        </Link>
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Ver Pedidos
        </Link>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pedidos Pendentes</h2>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((order: any) => (
              <Link
                key={order.orderId}
                to={`/orders/${order.orderId}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pedido #{order.orderId?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">R$ {(order.totalInCents / 100).toFixed(2)}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    Pendente
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Ultimas Transacoes</h2>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx: any) => (
              <Link
                key={tx.transactionId}
                to={`/transactions/${tx.transactionId}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.transactionId}</p>
                    <p className="text-xs text-gray-500">R$ {(tx.amountInCents / 100).toFixed(2)}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tx.status === 'APPROVED' ? 'Aprovado' : tx.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
