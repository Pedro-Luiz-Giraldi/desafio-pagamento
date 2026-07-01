import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useOrder, useCancelOrder } from '@/hooks/use-orders'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatCents, formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast-store'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useOrder(id ?? '')
  const cancelOrder = useCancelOrder()
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleCancel() {
    if (!id) return
    try {
      await cancelOrder.mutateAsync(id)
      toast.success('Pedido cancelado com sucesso')
      setShowConfirm(false)
    } catch {
      toast.error('Erro ao cancelar pedido')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="space-y-3"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-6 w-1/2" /></CardContent></Card>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Detalhe do Pedido</h2>
        <p className="text-sm text-red-600">Erro ao carregar pedido</p>
        <Button variant="secondary" onClick={() => navigate('/orders')}>Voltar</Button>
      </div>
    )
  }

  const order = data.data
  const canCancel = order.status === 'PENDING'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pedido #{order.orderId.slice(0, 8)}</h2>
          <p className="text-sm text-gray-500 mt-1">Criado em {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/orders')}>Voltar</Button>
          {canCancel && (
            <Button variant="danger" onClick={() => setShowConfirm(true)} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? <Spinner label="Cancelando" /> : 'Cancelar Pedido'}
            </Button>
          )}
          {user?.role === 'CUSTOMER' && order.status === 'PENDING' && !order.transactionId && (
            <Button onClick={() => navigate(`/pay/${order.orderId}`)}>
              Pagar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{formatCents(order.totalInCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cliente</span>
              <span className="text-gray-900">{order.customerId}</span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transação</span>
                <button onClick={() => navigate(`/transactions/${order.transactionId}`)} className="font-mono text-xs text-emerald-700 hover:underline">
                  {order.transactionId.slice(0, 8)}...
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Qtd</th>
                  <th className="pb-2 font-medium">Preço</th>
                  <th className="pb-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 text-gray-900">{item.description}</td>
                    <td className="py-2 text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-gray-600">{formatCents(item.unitPriceInCents)}</td>
                    <td className="py-2 text-right font-medium">{formatCents(item.subtotalInCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Cancelar Pedido"
        message="Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Cancelar"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowConfirm(false)}
        loading={cancelOrder.isPending}
      />
    </div>
  )
}
