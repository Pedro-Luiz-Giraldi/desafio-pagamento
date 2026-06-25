import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTransaction, useRefundTransaction } from '@/hooks/use-transactions'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatCents, formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast-store'
import { useAuthStore } from '@/stores/auth.store'
import type { RefundReason } from '@/types/transaction'

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useTransaction(id ?? '')
  const refundMutation = useRefundTransaction()
  const [showRefund, setShowRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState<RefundReason>('CUSTOMER_REQUEST')

  const canRefund = data?.data?.status === 'APPROVED'

  async function handleRefund() {
    if (!id || !user) return
    const amount = parseInt(refundAmount)
    if (!amount || amount <= 0) {
      toast.error('Valor de estorno inválido')
      return
    }
    try {
      await refundMutation.mutateAsync({
        id,
        input: { amountInCents: amount, reason: refundReason, requestedBy: user.userId },
      })
      toast.success('Estorno processado com sucesso')
      setShowRefund(false)
    } catch {
      toast.error('Erro ao processar estorno')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="space-y-3"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /></CardContent></Card>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Detalhe da Transação</h2>
        <p className="text-sm text-red-600">Erro ao carregar transação</p>
        <Button variant="secondary" onClick={() => navigate('/transactions')}>Voltar</Button>
      </div>
    )
  }

  const txn = data.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transação #{txn.transactionId.slice(0, 8)}</h2>
          <p className="text-sm text-gray-500 mt-1">{formatDate(txn.createdAt)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/transactions')}>Voltar</Button>
          {canRefund && (
            <Button variant="danger" onClick={() => setShowRefund(true)}>Estornar</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={txn.status} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor</span>
              <span className="font-semibold">{formatCents(txn.amountInCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Moeda</span>
              <span className="text-gray-900">{txn.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tempo de Processamento</span>
              <span className="text-gray-900">{txn.processingTimeMs}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {txn.cardBrand && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bandeira</span>
                <span className="text-gray-900">{txn.cardBrand}</span>
              </div>
            )}
            {txn.cardLastFour && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Final do Cartão</span>
                <span className="text-gray-900">****{txn.cardLastFour}</span>
              </div>
            )}
            {txn.installments && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Parcelas</span>
                <span className="text-gray-900">{txn.installments}x</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pedido</span>
              <button onClick={() => navigate(`/orders/${txn.orderId}`)} className="font-mono text-xs text-emerald-700 hover:underline">
                {txn.orderId.slice(0, 8)}...
              </button>
            </div>
            {txn.mpPaymentId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">MP Payment ID</span>
                <span className="font-mono text-xs text-gray-500">{txn.mpPaymentId}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {txn.refunds && txn.refunds.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Histórico de Estornos</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Motivo</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {txn.refunds.map((refund) => (
                  <tr key={refund.refundId} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-medium">{formatCents(refund.amountInCents)}</td>
                    <td className="py-2 text-gray-600">{refund.reason}</td>
                    <td className="py-2"><StatusBadge status={refund.status as any} /></td>
                    <td className="py-2 text-gray-500">{formatDate(refund.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showRefund}
        title="Processar Estorno"
        message=""
        confirmLabel="Confirmar Estorno"
        variant="danger"
        onConfirm={handleRefund}
        onCancel={() => setShowRefund(false)}
        loading={refundMutation.isPending}
      />

      {showRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-label="Estorno" className="w-full max-w-md rounded-md bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-950">Processar Estorno</h2>
              <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={() => setShowRefund(false)}>Fechar</Button>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="Valor do Estorno (centavos)"
                type="number"
                min={1}
                max={txn.amountInCents}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-800">Motivo</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value as RefundReason)}
                  className="block min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="CUSTOMER_REQUEST">Solicitação do Cliente</option>
                  <option value="DUPLICATE">Duplicidade</option>
                  <option value="FRAUD">Fraude</option>
                  <option value="PRODUCT_NOT_DELIVERED">Produto Não Entregue</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Valor máximo: {formatCents(txn.amountInCents)}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowRefund(false)}>Cancelar</Button>
                <Button variant="danger" onClick={handleRefund} disabled={refundMutation.isPending}>
                  {refundMutation.isPending ? <Spinner label="Processando" /> : 'Confirmar Estorno'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
