import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useOrdersList } from '@/hooks/use-orders'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { formatCents, formatDate } from '@/lib/utils'
import { PAGE_SIZE } from '@/lib/constants'

export function OrdersListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
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
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0A2540]">Pedidos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie todos os pedidos</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 bg-white transition-smooth focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {user?.role === 'CUSTOMER' && (
            <Button size="sm" onClick={() => navigate('/orders/new')} className="whitespace-nowrap">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Todos os Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <p className="text-xs text-[#EF4444]">Erro ao carregar pedidos</p>
          ) : !data?.data.content.length ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-500">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              {/* Desktop Table - More Compact */}
              <div className="hidden md:block overflow-x-auto -mx-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left bg-slate-50">
                      <th className="py-2 px-6 font-semibold uppercase tracking-wider text-slate-600">ID</th>
                      <th className="py-2 px-3 font-semibold uppercase tracking-wider text-slate-600">Itens</th>
                      <th className="py-2 px-3 font-semibold uppercase tracking-wider text-slate-600">Total</th>
                      <th className="py-2 px-3 font-semibold uppercase tracking-wider text-slate-600">Status</th>
                      <th className="py-2 px-3 font-semibold uppercase tracking-wider text-slate-600">Data</th>
                      <th className="py-2 px-6 font-semibold uppercase tracking-wider text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.content.map((order) => (
                      <tr
                        key={order.orderId}
                        onClick={() => navigate(`/orders/${order.orderId}`)}
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-smooth"
                      >
                        <td className="py-2.5 px-6 font-mono text-slate-500">{order.orderId.slice(0, 8)}...</td>
                        <td className="py-2.5 px-3 text-slate-900">{order.items.length} item(ns)</td>
                        <td className="py-2.5 px-3 font-bold text-[#0A2540] tabular-nums">{formatCents(order.totalInCents)}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={order.status} /></td>
                        <td className="py-2.5 px-3 text-slate-600">{formatDate(order.createdAt)}</td>
                        <td className="py-2.5 px-6">
                          {user?.role === 'CUSTOMER' && order.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); navigate(`/pay/${order.orderId}`) }}
                            >
                              Pagar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - More Compact */}
              <div className="md:hidden space-y-2">
                {data.data.content.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer transition-smooth"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{order.orderId.slice(0, 8)}...</span>
                        <span className="text-xs text-slate-600">• {order.items.length} item(ns)</span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#0A2540] tabular-nums">{formatCents(order.totalInCents)}</span>
                      <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                    </div>
                    {user?.role === 'CUSTOMER' && order.status === 'PENDING' && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => { e.stopPropagation(); navigate(`/pay/${order.orderId}`) }}
                      >
                        Pagar
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {data.data.totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Pagination page={page} totalPages={data.data.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
