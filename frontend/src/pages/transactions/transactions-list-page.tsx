import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactionsList } from '@/hooks/use-transactions'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { formatCents, formatDate } from '@/lib/utils'
import { PAGE_SIZE } from '@/lib/constants'

export function TransactionsListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading, isError } = useTransactionsList({
    page,
    size: PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'DECLINED', label: 'Recusado' },
    { value: 'SUSPECTED_FRAUD', label: 'Fraude Suspeita' },
    { value: 'FULLY_REFUNDED', label: 'Reembolsado' },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Transações</h2>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CardTitle>Todas as Transações</CardTitle>
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
            <p className="text-sm text-red-600">Erro ao carregar transações</p>
          ) : !data?.data.length ? (
            <p className="text-sm text-gray-500">Nenhuma transação encontrada</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Valor</th>
                      <th className="pb-3 font-medium">Cartão</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((txn) => (
                      <tr
                        key={txn.transactionId}
                        onClick={() => navigate(`/transactions/${txn.transactionId}`)}
                        className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3 font-mono text-xs text-gray-500">{txn.transactionId.slice(0, 8)}...</td>
                        <td className="py-3 font-medium text-gray-900">{formatCents(txn.amountInCents)}</td>
                        <td className="py-3 text-gray-600">
                          {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : '-'}
                        </td>
                        <td className="py-3"><StatusBadge status={txn.status} /></td>
                        <td className="py-3 text-gray-500">{formatDate(txn.createdAt)}</td>
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
                    className="border border-gray-200 rounded-lg p-4 space-y-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-500">{txn.transactionId.slice(0, 8)}...</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {txn.cardBrand ? `${txn.cardBrand} ****${txn.cardLastFour ?? ''}` : 'Transação'}
                        </p>
                      </div>
                      <StatusBadge status={txn.status} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-lg font-semibold text-gray-900">{formatCents(txn.amountInCents)}</span>
                      <span className="text-xs text-gray-500">{formatDate(txn.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
