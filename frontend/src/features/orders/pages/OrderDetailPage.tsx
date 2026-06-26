import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService } from '@features/orders/services/ordersService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@shared/components/StatusBadge'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { formatDate } from '@shared/utils/formatDate'
import { ROUTES } from '@lib/constants'
import type { Order } from '@lib/types/orders.types'

function useCountdown(expiresAt: string | undefined) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return secondsLeft
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { role } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const secondsLeft = useCountdown(order?.status === 'PENDING' ? order.expiresAt : undefined)
  const expired = secondsLeft !== null && secondsLeft === 0

  useEffect(() => {
    if (!id) return
    ordersService.getOrderById(id).then(result => {
      if (result.ok) setOrder(result.data)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    setCancelError(null)
    const result = await ordersService.cancelOrder(id)
    if (result.ok) {
      const refreshed = await ordersService.getOrderById(id)
      if (refreshed.ok) setOrder(refreshed.data)
      setShowCancelDialog(false)
    } else {
      setCancelError('Não foi possível cancelar o pedido. Tente novamente.')
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-lg font-medium">Pedido não encontrado</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.ORDERS}>Voltar para pedidos</Link>
        </Button>
      </div>
    )
  }

  const isCustomer = role === 'CUSTOMER'
  const isPending = order.status === 'PENDING' && !expired
  const canPay = isCustomer && isPending
  const canCancel = isCustomer && isPending

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Pedido #{order.id.slice(0, 8)}</h1>
      </div>

      {/* Timer */}
      {order.status === 'PENDING' && secondsLeft !== null && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            expired
              ? 'bg-gray-100 text-gray-600'
              : secondsLeft < 120
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}
        >
          <Clock className="h-4 w-4 flex-none" />
          {expired ? (
            <span>Pedido expirado</span>
          ) : (
            <span>Expira em <strong>{formatCountdown(secondsLeft)}</strong></span>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Resumo do pedido</CardTitle>
          <StatusBadge status={expired ? 'CANCELLED' : order.status} />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-semibold text-lg">{formatCurrency(order.amountInCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Criado em</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          {order.description && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descrição</span>
              <span className="text-right max-w-xs">{order.description}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID do pedido</span>
            <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
          </div>
        </CardContent>
      </Card>

      {(canPay || canCancel) && (
        <div className="flex gap-3">
          {canPay && (
            <Button asChild className="flex-1">
              <Link to={ROUTES.PAYMENT.replace(':id', order.id)}>Pagar agora</Link>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">Cancelar pedido?</h3>
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
            {cancelError && (
              <p className="text-xs text-destructive">{cancelError}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowCancelDialog(false); setCancelError(null) }}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
