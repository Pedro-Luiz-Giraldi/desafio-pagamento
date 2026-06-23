import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const schema = z.object({ email: z.string().email('E-mail inválido') })
type Form = z.infer<typeof schema>

export default function ResendConfirmationPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    await authService.resendConfirmation(data.email)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <MailCheck className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-semibold">E-mail reenviado</h2>
        <p className="text-sm text-muted-foreground">
          Se o endereço{' '}
          <span className="font-medium text-foreground">{getValues('email')}</span>{' '}
          estiver cadastrado, você receberá um novo link de confirmação em breve.
        </p>
        <Link to={ROUTES.LOGIN} className="text-sm text-primary font-medium hover:underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Reenviar confirmação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informe seu e-mail para receber um novo link de ativação.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="ana@exemplo.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Enviando...
            </span>
          ) : (
            'Reenviar link'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
