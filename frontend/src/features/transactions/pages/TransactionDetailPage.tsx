import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { RefundModal } from '@features/transactions/components/RefundModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@shared/components/StatusBadge'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import { ROUTES, getErrorMessage } from '@lib/constants'
import { REFUND_REASON_LABELS } from '@lib/types/transactions.types'
import type { TransactionDetail } from '@lib/types/transactions.types'

const REFUNDABLE_STATUSES = new Set(['APPROVED', 'PARTIALLY_REFUNDED'])

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { role } = useAuth()
  const navigate = useNavigate()

  const [tx, setTx] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    transactionsService.getTransactionById(id).then(result => {
      if (result.ok) setTx(result.data)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

  useEffect(() => { load() }, [load])

  function handleRefundSuccess() {
    setShowRefundModal(false)
    load()
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (notFound || !tx) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-lg font-medium">Transação não encontrada</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.TRANSACTIONS}>Voltar para transações</Link>
        </Button>
      </div>
    )
  }

  const isMerchant = role === 'MERCHANT_OWNER'
  const canRefund = isMerchant && REFUNDABLE_STATUSES.has(tx.status)

  const sortedRefunds = [...(tx.refunds ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.TRANSACTIONS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Transação #{tx.transactionId.slice(0, 8)}</h1>
      </div>

      {/* Main info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Detalhes</CardTitle>
          <StatusBadge status={tx.status} />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor total</span>
            <span className="font-semibold text-lg">{formatCurrency(tx.amountInCents)}</span>
          </div>
          {tx.totalRefundedInCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total reembolsado</span>
              <span className="text-red-600">− {formatCurrency(tx.totalRefundedInCents)}</span>
            </div>
          )}
          {canRefund && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Disponível para reembolso</span>
              <span className="font-medium">{formatCurrency(tx.availableForRefundInCents)}</span>
            </div>
          )}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data</span>
              <span>{formatDate(tx.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedido</span>
              <span className="font-mono text-xs">{tx.orderId?.slice(0, 8) ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span>{tx.customerName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cartão</span>
              <span>{tx.cardBrand} •••• {tx.cardLastFour}</span>
            </div>
            {tx.errorCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código de erro</span>
                <span className="text-destructive text-xs">{getErrorMessage(tx.errorCode)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {canRefund && (
        <Button onClick={() => setShowRefundModal(true)}>Reembolsar</Button>
      )}

      {/* Refunds history */}
      {sortedRefunds.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Histórico de reembolsos</h2>
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {sortedRefunds.map(r => (
              <div key={r.refundId} className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">{formatCurrency(r.amountInCents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {REFUND_REASON_LABELS[r.reason]} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <StatusBadge status={r.status === 'APPROVED' ? 'APPROVED' : r.status === 'REJECTED' ? 'DECLINED' : 'PROCESSING'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showRefundModal && tx && (
        <RefundModal
          transactionId={tx.transactionId}
          availableForRefundInCents={tx.availableForRefundInCents}
          onSuccess={handleRefundSuccess}
          onClose={() => setShowRefundModal(false)}
        />
      )}
    </div>
  )
}
