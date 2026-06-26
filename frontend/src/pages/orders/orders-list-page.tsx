import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrdersList } from '@/hooks/use-orders'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { formatCents, formatDate } from '@/lib/utils'
import { PAGE_SIZE } from '@/lib/constants'

export function OrdersListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading, isError } = useOrdersList({
    page,
    size: PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'PAID', label: 'Pago' },
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'REFUNDED', label: 'Reembolsado' },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <Button onClick={() => navigate('/orders/new')} className="w-full sm:w-auto">
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CardTitle>Todos os Pedidos</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }}
              className="sm:ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600">Erro ao carregar pedidos</p>
          ) : !data?.data.content.length ? (
            <p className="text-sm text-gray-500">Nenhum pedido encontrado</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Itens</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.content.map((order) => (
                      <tr
                        key={order.orderId}
                        onClick={() => navigate(`/orders/${order.orderId}`)}
                        className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3 font-mono text-xs text-gray-500">{order.orderId.slice(0, 8)}...</td>
                        <td className="py-3 text-gray-900">{order.items.length} item(ns)</td>
                        <td className="py-3 font-medium text-gray-900">{formatCents(order.totalInCents)}</td>
                        <td className="py-3"><StatusBadge status={order.status} /></td>
                        <td className="py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data.data.content.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="border border-gray-200 rounded-lg p-4 space-y-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-500">{order.orderId.slice(0, 8)}...</p>
                        <p className="text-sm text-gray-900 mt-1">{order.items.length} item(ns)</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-lg font-semibold text-gray-900">{formatCents(order.totalInCents)}</span>
                      <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Pagination page={page} totalPages={data.data.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
