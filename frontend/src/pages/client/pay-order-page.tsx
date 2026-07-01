import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useOrder } from '@/hooks/use-orders'
import { useProcessPayment } from '@/hooks/use-transactions'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Spinner } from '@/components/ui'
import { v4 as uuidv4 } from 'uuid'

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => MercadoPagoInstance
  }
}

interface MercadoPagoInstance {
  createCardToken: (params: { cardNumber: string; cardExpirationMonth: string; cardExpirationYear: string; securityCode: string; cardholderName: string }) => Promise<{ id: string }>
}

export function PayOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: orderData, isLoading: orderLoading, error: orderError } = useOrder(orderId!)
  const processPayment = useProcessPayment()

  const mpInitialized = useRef(false)

  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [installments, setInstallments] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<'success' | 'failed' | null>(null)

  useEffect(() => {
    if (!mpInitialized.current && typeof window !== 'undefined' && !document.querySelector('script[src*="mercadopago"]')) {
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      document.body.appendChild(script)
      mpInitialized.current = true
    }
  }, [])

  if (orderLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner label="Carregando pedido..." />
      </div>
    )
  }

  if (orderError || !orderData) {
    return (
      <div className="p-6">
        <p className="text-red-500">Pedido nao encontrado.</p>
        <Link to="/orders" className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
          &larr; Voltar para pedidos
        </Link>
      </div>
    )
  }

  const order = 'order' in orderData ? (orderData as any).order : orderData

  if (order.status !== 'PENDING') {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-bold text-gray-900">Pedido #{order.orderId?.slice(0, 8)}</h1>
          <p className="text-gray-500 mt-2">
            Status: <span className="font-medium">{order.status}</span>
          </p>
          {order.status === 'PAID' && (
            <p className="text-green-600 mt-2">Este pedido ja foi pago.</p>
          )}
          <Link to={`/orders/${orderId}`} className="text-sm text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
            Ver detalhes do pedido
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProcessing(true)

    try {
      const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || '')
      const [expMonth, expYear] = cardExpiry.split('/').map((s) => s.trim())

      const cardToken = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cardCvv,
        cardholderName,
      })

      const paymentResult = await processPayment.mutateAsync({
        amountInCents: order.totalInCents,
        currency: 'BRL',
        customerId: user!.userId,
        orderId: orderId!,
        cardToken: cardToken.id,
        paymentMethodId: 'credit_card',
        installments,
        idempotencyKey: uuidv4(),
      })

      const txStatus = (paymentResult as any)?.data?.status
      if (txStatus === 'APPROVED') {
        setResult('success')
        setTimeout(() => navigate(`/orders/${orderId}`), 2000)
      } else {
        setResult('failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar pagamento. Tente novamente.')
      setResult('failed')
    } finally {
      setProcessing(false)
    }
  }

  if (result === 'success') {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-semibold text-green-800">Pagamento aprovado!</p>
          <p className="text-sm text-green-600 mt-1">Redirecionando para o detalhe do pedido...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamento</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pedido #{order.orderId?.slice(0, 8)} &mdash; R$ {(order.totalInCents / 100).toFixed(2)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome no Cartao"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Nome como esta no cartao"
          required
        />
        <Input
          label="Numero do Cartao"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Validade"
            value={cardExpiry}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '')
              if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2)
              setCardExpiry(val)
            }}
            placeholder="MM/AA"
            maxLength={5}
            required
          />
          <Input
            label="CVV"
            value={cardCvv}
            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>
                {n}x de R$ {((order.totalInCents / 100) / n).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" disabled={processing} className="w-full">
          {processing ? <Spinner label="Processando pagamento..." /> : `Pagar R$ ${(order.totalInCents / 100).toFixed(2)}`}
        </Button>

        <Link
          to={`/orders/${orderId}`}
          className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
        >
          Cancelar e voltar para o pedido
        </Link>
      </form>
    </div>
  )
}
