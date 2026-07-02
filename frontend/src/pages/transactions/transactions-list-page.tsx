import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useTransactionsList } from '@/hooks/use-transactions'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { formatCents, formatDate } from '@/lib/utils'
import { PAGE_SIZE } from '@/lib/constants'

export function TransactionsListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading, isError } = useTransactionsList({
    page,
    size: PAGE_SIZE,
    status: statusFilter || undefined,
    customerId: user?.role === 'CUSTOMER' ? user.userId : undefined,
  })

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'DECLINED', label: 'Recusado' },
    { value: 'SUSPECTED_FRAUD', label: 'Fraude Suspeita' },
    { value: 'FULLY_REFUNDED', label: 'Reembolsado' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0A2540]">Transações</h1>
          <p className="text-xs text-slate-500 mt-0.5">Histórico completo de transações</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 bg-white transition-smooth focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-[#EF4444]">Erro ao carregar transações</p>
          ) : !data?.data.length ? (
            <p className="text-sm text-slate-500">Nenhuma transação encontrada</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-3 px-6 font-semibold text-xs uppercase tracking-wide text-slate-500">ID</th>
                      <th className="pb-3 px-3 font-semibold text-xs uppercase tracking-wide text-slate-500">Valor</th>
                      <th className="pb-3 px-3 font-semibold text-xs uppercase tracking-wide text-slate-500">Cartão</th>
                      <th className="pb-3 px-3 font-semibold text-xs uppercase tracking-wide text-slate-500">Status</th>
                      <th className="pb-3 px-6 font-semibold text-xs uppercase tracking-wide text-slate-500">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((txn) => (
                      <tr
                        key={txn.transactionId}
                        onClick={() => navigate(`/transactions/${txn.transactionId}`)}
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-smooth"
                      >
                        <td className="py-3.5 px-6 font-mono text-xs text-slate-500">{txn.transactionId.slice(0, 8)}...</td>
                        <td className="py-3.5 px-3 font-semibold text-[#0A2540] tabular-nums">{formatCents(txn.amountInCents)}</td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-xs">
                          {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : '-'}
                        </td>
                        <td className="py-3.5 px-3"><StatusBadge status={txn.status} /></td>
                        <td className="py-3.5 px-6 text-slate-600">{formatDate(txn.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data.data.map((txn) => (
                  <div
                    key={txn.transactionId}
                    onClick={() => navigate(`/transactions/${txn.transactionId}`)}
                    className="border border-slate-200 rounded-lg p-4 space-y-3 hover:bg-slate-50 cursor-pointer transition-smooth"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-mono text-slate-500">{txn.transactionId.slice(0, 8)}...</p>
                        <p className="text-sm text-slate-600 mt-1 font-mono text-xs">
                          {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : 'Transação'}
                        </p>
                      </div>
                      <StatusBadge status={txn.status} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-lg font-bold text-[#0A2540] tabular-nums">{formatCents(txn.amountInCents)}</span>
                      <span className="text-xs text-slate-500">{formatDate(txn.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {data.meta.totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
