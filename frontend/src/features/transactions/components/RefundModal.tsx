import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { transactionsService } from '@features/transactions/services/transactionsService'
import { useIdempotencyKey } from '@shared/hooks/useIdempotencyKey'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { REFUND_REASON_LABELS } from '@lib/types/transactions.types'
import type { RefundReason } from '@lib/types/transactions.types'

interface RefundModalProps {
  transactionId: string
  availableForRefundInCents: number
  onSuccess: () => void
  onClose: () => void
}

function buildSchema(maxCents: number) {
  return z.object({
    amountDisplay: z
      .string()
      .min(1, 'Informe o valor')
      .refine(v => {
        const cents = Math.round(parseFloat(v.replace(',', '.')) * 100)
        return cents >= 1
      }, 'Valor deve ser maior que zero')
      .refine(v => {
        const cents = Math.round(parseFloat(v.replace(',', '.')) * 100)
        return cents <= maxCents
      }, 'Valor excede o disponível para reembolso'),
    reason: z.enum(
      ['CUSTOMER_REQUEST', 'DUPLICATE', 'FRAUD', 'PRODUCT_NOT_DELIVERED'] as const,
      { error: 'Selecione o motivo do reembolso' }
    ),
  })
}

type FormData = { amountDisplay: string; reason: RefundReason }

export function RefundModal({ transactionId, availableForRefundInCents, onSuccess, onClose }: RefundModalProps) {
  const { key: idempotencyKey } = useIdempotencyKey()
  const [serverError, setServerError] = useState<{ message: string; retryable: boolean } | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const schema = buildSchema(availableForRefundInCents)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amountDisplay: (availableForRefundInCents / 100).toFixed(2).replace('.', ','),
    },
  })

  const reasonValue = watch('reason')

  async function onSubmit(data: FormData) {
    setServerError(null)
    const amountInCents = Math.round(parseFloat(data.amountDisplay.replace(',', '.')) * 100)

    const result = await transactionsService.createRefund(
      transactionId,
      { amountInCents, reason: data.reason },
      idempotencyKey
    )

    if (result.ok) {
      setSucceeded(true)
      setTimeout(onSuccess, 2000)
      return
    }

    if (result.error.errorCode === 'REFUND_ALREADY_PROCESSED') {
      setServerError({ message: 'Este reembolso já foi processado.', retryable: false })
    } else if (result.error.retryable) {
      setServerError({ message: 'Erro ao processar. Tente novamente.', retryable: true })
    } else {
      setServerError({ message: result.error.message, retryable: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
        {succeeded ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-lg font-semibold text-green-700">Reembolso solicitado!</p>
            <p className="text-sm text-muted-foreground">Fechando em instantes...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Solicitar reembolso</h3>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                ×
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Disponível para reembolso:{' '}
              <strong>{formatCurrency(availableForRefundInCents)}</strong>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="refund-amount">Valor do reembolso (R$)</Label>
                <Input
                  id="refund-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  {...register('amountDisplay')}
                />
                {errors.amountDisplay && (
                  <p className="text-xs text-destructive">{errors.amountDisplay.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Select
                  value={reasonValue}
                  onValueChange={v => setValue('reason', v as RefundReason, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REFUND_REASON_LABELS) as RefundReason[]).map(key => (
                      <SelectItem key={key} value={key}>
                        {REFUND_REASON_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason.message}</p>
                )}
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                >
                  {serverError.message}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || (serverError !== null && !serverError.retryable)}
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar reembolso'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
