import { useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, CheckCircle2, XCircle, CreditCard, Package, LogIn } from 'lucide-react'
import { ordersService } from '@features/orders/services/ordersService'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { productService } from '@features/products/services/productService'
import { useMercadoPago } from '@features/transactions/hooks/useMercadoPago'
import { useIdempotencyKey } from '@shared/hooks/useIdempotencyKey'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES } from '@lib/constants'

function detectPaymentMethod(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, '')
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(n)) return 'elo'
  if (/^5[0-5]/.test(n) || /^2[2-7]/.test(n)) return 'master'
  if (/^4/.test(n)) return 'visa'
  return 'credit_card'
}

const cardSchema = z.object({
  cardNumber: z.string().min(13, 'Número inválido').max(19).regex(/^\d+$/, 'Apenas números'),
  cardholderName: z.string().min(2, 'Informe o nome como no cartão'),
  expirationMonth: z.string().length(2, 'MM').regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  expirationYear: z.string().length(4, 'AAAA').regex(/^\d{4}$/, 'Ano inválido'),
  securityCode: z.string().min(3, 'CVV inválido').max(4).regex(/^\d+$/, 'Apenas números'),
})
type CardForm = z.infer<typeof cardSchema>

type StepState = 'idle' | 'processing' | 'done' | 'error'

interface Pipeline {
  fraud: StepState
  gateway: StepState
  confirmation: StepState
}

const PAYMENT_ERRORS: Record<string, string> = {
  CARD_DECLINED: 'Cartão recusado. Verifique os dados ou tente outro cartão.',
  SUSPECTED_FRAUD: 'Transação não autorizada. Entre em contato com o suporte.',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente.',
  INVALID_CARD: 'Dados do cartão inválidos.',
  CARD_EXPIRED: 'Cartão expirado.',
  TIMEOUT: 'Erro de conexão. Tente novamente.',
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export default function CheckoutPage() {
  const { merchantId, productId } = useParams<{ merchantId: string; productId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { createCardToken, isReady } = useMercadoPago()
  const { key: idempotencyKey, reset: resetKey } = useIdempotencyKey()

  const product = (() => {
    if (!merchantId || !productId) return null
    // Prefer data embedded in URL (?d=base64) — works across any browser/device
    const encoded = searchParams.get('d')
    if (encoded) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))))
        return {
          id: productId,
          name: decoded.name as string,
          description: (decoded.description ?? '') as string,
          priceInCents: decoded.priceInCents as number,
          active: true,
          createdAt: '',
        }
      } catch { /* fall through to localStorage */ }
    }
    // Fallback: localStorage (same browser as merchant)
    return productService.getActiveProducts(merchantId).find(p => p.id === productId) ?? null
  })()

  const [screen, setScreen] = useState<'form' | 'success' | 'failure'>('form')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [pipeline, setPipeline] = useState<Pipeline>({ fraud: 'idle', gateway: 'idle', confirmation: 'idle' })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardForm>({ resolver: zodResolver(cardSchema) })

  async function onSubmit(data: CardForm) {
    if (!product || !merchantId || !user) return
    setPaymentError(null)
    setPipeline({ fraud: 'idle', gateway: 'idle', confirmation: 'idle' })

    const tokenResult = await createCardToken({
      cardNumber: data.cardNumber,
      cardholderName: data.cardholderName,
      cardExpirationMonth: data.expirationMonth,
      cardExpirationYear: data.expirationYear,
      securityCode: data.securityCode,
    })

    if ('error' in tokenResult) {
      setPaymentError(tokenResult.error)
      return
    }

    const orderResult = await ordersService.createOrder({
      merchantId,
      items: [{ product, quantity: 1 }],
    })

    if (!orderResult.ok) {
      setPaymentError('Não foi possível criar o pedido. Tente novamente.')
      return
    }

    // Animate gateway pipeline
    setPipeline({ fraud: 'processing', gateway: 'idle', confirmation: 'idle' })
    await delay(700)
    setPipeline({ fraud: 'done', gateway: 'processing', confirmation: 'idle' })

    const txResult = await transactionsService.createTransaction({
      orderId: orderResult.data.id,
      cardToken: tokenResult.token,
      amountInCents: product.priceInCents,
      currency: 'BRL',
      customerId: user.id,
      merchantId: merchantId!,
      paymentMethodId: detectPaymentMethod(data.cardNumber),
      installments: 1,
      idempotencyKey,
    })

    if (!txResult.ok) {
      setPipeline({ fraud: 'done', gateway: 'error', confirmation: 'idle' })
      const msg = PAYMENT_ERRORS[txResult.error.errorCode] ?? 'Erro ao processar pagamento.'
      if (!txResult.error.retryable) resetKey()
      setPaymentError(msg)
      setRetryable(txResult.error.retryable)
      await delay(400)
      setScreen('failure')
      return
    }

    setTransactionId(txResult.data.transactionId)
    setPipeline({ fraud: 'done', gateway: 'done', confirmation: 'processing' })
    await delay(600)
    setPipeline({ fraud: 'done', gateway: 'done', confirmation: 'done' })
    await delay(300)
    setScreen('success')
  }

  function handleRetry() {
    setScreen('form')
    setPipeline({ fraud: 'idle', gateway: 'idle', confirmation: 'idle' })
    setPaymentError(null)
    setRetryable(false)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
          <p className="font-semibold">Produto não encontrado</p>
          <p className="text-sm text-muted-foreground">
            O link pode estar incorreto ou o produto foi desativado.
          </p>
        </div>
      </div>
    )
  }

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <span className="text-base font-bold text-primary">Acabou o Mony</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-600" />
            Checkout seguro
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <div className="bg-white rounded-xl border p-5 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Produto</p>
              <p className="text-lg font-semibold">{product.name}</p>
              {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
              <p className="text-2xl font-bold text-primary pt-1">{formatCurrency(product.priceInCents)}</p>
            </div>
            <div className="bg-white rounded-xl border p-6 text-center space-y-4">
              <LogIn className="h-10 w-10 text-primary mx-auto" />
              <div>
                <p className="font-semibold">Faça login para continuar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  É necessário ter uma conta para finalizar a compra.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Entrar
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.REGISTER}>
                    Criar conta
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const showPipeline = (screen === 'form' && isSubmitting) || screen === 'success' || screen === 'failure'

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-primary">Acabou o Mony</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-green-600" />
          Checkout seguro
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-lg space-y-4 pt-4">

          {/* Product summary */}
          <div className="bg-white rounded-xl border p-5 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Produto</p>
            <p className="text-lg font-semibold">{product.name}</p>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <p className="text-2xl font-bold text-primary pt-1">{formatCurrency(product.priceInCents)}</p>
          </div>

          {/* Gateway pipeline */}
          {showPipeline && <GatewayPipeline pipeline={pipeline} />}

          {/* Success */}
          {screen === 'success' && (
            <div className="bg-white rounded-xl border border-green-200 p-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">Pagamento aprovado!</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(product.priceInCents)} processados com sucesso.
              </p>
              {transactionId && (
                <p className="text-xs font-mono text-muted-foreground">
                  Transação #{transactionId.slice(0, 8)}
                </p>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ORDERS)}>
                Ver meus pedidos
              </Button>
            </div>
          )}

          {/* Failure */}
          {screen === 'failure' && (
            <div className="bg-white rounded-xl border border-destructive/20 p-6 text-center space-y-3">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-semibold">Pagamento recusado</p>
              <p className="text-sm text-muted-foreground">{paymentError}</p>
              {retryable && (
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {/* Payment form */}
          {screen === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
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
                  {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber.message}</p>}
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

              {paymentError && !isSubmitting && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                >
                  {paymentError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !isReady}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Processando...
                  </span>
                ) : (
                  `Pagar ${formatCurrency(product.priceInCents)}`
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 pb-6">
            <Shield className="h-3 w-3" />
            Pagamento processado com segurança pelo gateway Acabou o Mony
          </p>
        </div>
      </div>
    </div>
  )
}

function GatewayPipeline({ pipeline }: { pipeline: Pipeline }) {
  const steps: { label: string; state: StepState }[] = [
    { label: 'Verificação antifraude', state: pipeline.fraud },
    { label: 'Processamento via gateway (Mercado Pago)', state: pipeline.gateway },
    { label: 'Confirmação do pagamento', state: pipeline.confirmation },
  ]

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Pipeline do gateway
      </p>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <StepIcon state={s.state} />
          <span
            className={`text-sm ${
              s.state === 'done'
                ? 'text-foreground font-medium'
                : s.state === 'error'
                  ? 'text-destructive font-medium'
                  : s.state === 'processing'
                    ? 'text-primary'
                    : 'text-muted-foreground'
            }`}
          >
            {s.label}
            {s.state === 'done' && ' ✓'}
          </span>
        </div>
      ))}
    </div>
  )
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'idle')
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-none" />
  if (state === 'processing')
    return (
      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-none" />
    )
  if (state === 'done')
    return <CheckCircle2 className="h-4 w-4 text-green-500 flex-none" />
  return <XCircle className="h-4 w-4 text-destructive flex-none" />
}
