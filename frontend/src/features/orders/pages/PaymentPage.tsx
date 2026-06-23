import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { ordersService } from '@features/orders/services/ordersService'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { useMercadoPago } from '@features/transactions/hooks/useMercadoPago'
import { useIdempotencyKey } from '@shared/hooks/useIdempotencyKey'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES, ERROR_MESSAGES } from '@lib/constants'
import type { Order } from '@lib/types/orders.types'

const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  CARD_DECLINED: 'Cartão recusado. Verifique os dados ou tente com outro cartão.',
  SUSPECTED_FRAUD: 'Não foi possível processar o pagamento. Entre em contato com o suporte.',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente. Tente com outro cartão.',
  INVALID_CARD: 'Dados do cartão inválidos.',
  CARD_EXPIRED: 'Cartão expirado. Tente com outro cartão.',
  TIMEOUT: 'Erro de conexão. Verifique sua internet e tente novamente.',
  ...ERROR_MESSAGES,
}

const cardSchema = z.object({
  cardNumber: z.string().min(13, 'Número inválido').max(19, 'Número inválido').regex(/^\d+$/, 'Apenas números'),
  cardholderName: z.string().min(2, 'Informe o nome como no cartão'),
  expirationMonth: z.string().length(2, 'MM').regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  expirationYear: z.string().length(4, 'AAAA').regex(/^\d{4}$/, 'Ano inválido'),
  securityCode: z.string().min(3, 'CVV inválido').max(4, 'CVV inválido').regex(/^\d+$/, 'Apenas números'),
})

type CardForm = z.infer<typeof cardSchema>

export default function PaymentPage() {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { createCardToken, isReady } = useMercadoPago()
  const { reset: resetKey } = useIdempotencyKey()

  const [order, setOrder] = useState<Order | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [paymentError, setPaymentError] = useState<{ message: string; retryable: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardForm>({ resolver: zodResolver(cardSchema) })

  useEffect(() => {
    if (!orderId) return
    ordersService.getOrderById(orderId).then(result => {
      if (result.ok) {
        if (result.data.status !== 'PENDING') {
          navigate(ROUTES.ORDER_DETAIL.replace(':id', orderId), { replace: true })
          return
        }
        setOrder(result.data)
      } else {
        navigate(ROUTES.ORDERS, { replace: true })
      }
      setLoadingOrder(false)
    })
  }, [orderId, navigate])

  async function onSubmit(data: CardForm) {
    if (!order || !orderId) return
    setSubmitting(true)
    setPaymentError(null)

    const tokenResult = await createCardToken({
      cardNumber: data.cardNumber,
      cardholderName: data.cardholderName,
      cardExpirationMonth: data.expirationMonth,
      cardExpirationYear: data.expirationYear,
      securityCode: data.securityCode,
    })

    if ('error' in tokenResult) {
      setPaymentError({ message: tokenResult.error, retryable: true })
      setSubmitting(false)
      return
    }

    const result = await transactionsService.createTransaction({
      orderId: order.id,
      cardToken: tokenResult.token,
      amountInCents: order.amountInCents,
      installments: 1,
    })

    if (result.ok) {
      navigate(ROUTES.ORDER_DETAIL.replace(':id', orderId), {
        state: { paymentSuccess: true },
        replace: true,
      })
      return
    }

    const msg = PAYMENT_ERROR_MESSAGES[result.error.errorCode] ?? 'Erro ao processar pagamento.'
    setPaymentError({ message: msg, retryable: result.error.retryable })
    if (!result.error.retryable) resetKey()
    setSubmitting(false)
  }

  if (loadingOrder) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTES.ORDER_DETAIL.replace(':id', orderId!))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Total: <strong>{formatCurrency(order.amountInCents)}</strong>
          </p>
        </div>
      </div>

      {!isReady && (
        <div className="rounded-lg border bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Carregando SDK de pagamento...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <CreditCard className="h-4 w-4" />
            Dados do cartão
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardNumber">Número do cartão</Label>
            <Input
              id="cardNumber"
              type="text"
              inputMode="numeric"
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
              {...register('cardNumber')}
            />
            {errors.cardNumber && (
              <p className="text-xs text-destructive">{errors.cardNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardholderName">Nome no cartão</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="NOME SOBRENOME"
              autoComplete="cc-name"
              {...register('cardholderName')}
            />
            {errors.cardholderName && (
              <p className="text-xs text-destructive">{errors.cardholderName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expirationMonth">Mês</Label>
              <Input
                id="expirationMonth"
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="MM"
                autoComplete="cc-exp-month"
                {...register('expirationMonth')}
              />
              {errors.expirationMonth && (
                <p className="text-xs text-destructive">{errors.expirationMonth.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expirationYear">Ano</Label>
              <Input
                id="expirationYear"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="AAAA"
                autoComplete="cc-exp-year"
                {...register('expirationYear')}
              />
              {errors.expirationYear && (
                <p className="text-xs text-destructive">{errors.expirationYear.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="securityCode">CVV</Label>
              <Input
                id="securityCode"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                autoComplete="cc-csc"
                {...register('securityCode')}
              />
              {errors.securityCode && (
                <p className="text-xs text-destructive">{errors.securityCode.message}</p>
              )}
            </div>
          </div>
        </div>

        {paymentError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {paymentError.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !isReady}
        >
          {submitting
            ? 'Processando...'
            : `Pagar ${formatCurrency(order.amountInCents)}`}
        </Button>

        {paymentError?.retryable && (
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={submitting}
          >
            Tentar novamente
          </Button>
        )}
      </form>
    </div>
  )
}
