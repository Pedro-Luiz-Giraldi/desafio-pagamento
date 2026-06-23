import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { ordersService } from '@features/orders/services/ordersService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const schema = z.object({
  amountInCents: z
    .string()
    .min(1, 'Informe o valor')
    .refine(v => parseFloat(v.replace(',', '.')) >= 0.01, 'Valor mínimo: R$ 0,01'),
  description: z.string().min(1, 'Informe a descrição').max(255, 'Máximo 255 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const amountInCents = Math.round(parseFloat(data.amountInCents.replace(',', '.')) * 100)

    const result = await ordersService.createOrder({
      amountInCents,
      currency: 'BRL',
      description: data.description,
    })

    if (!result.ok) {
      setServerError('Não foi possível criar o pedido. Tente novamente.')
      return
    }

    navigate(ROUTES.ORDER_DETAIL.replace(':id', result.data.id))
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Novo pedido</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para criar um pedido.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="amountInCents">Valor (R$)</Label>
          <Input
            id="amountInCents"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            {...register('amountInCents')}
          />
          {errors.amountInCents && (
            <p className="text-xs text-destructive">{errors.amountInCents.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            type="text"
            placeholder="Ex: Blusa tamanho M — cor azul"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando pedido...' : 'Criar pedido'}
        </Button>
      </form>
    </div>
  )
}
