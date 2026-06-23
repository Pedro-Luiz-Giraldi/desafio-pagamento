import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter número'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setApiError(null)
    const result = await authService.register(data.name, data.email, data.password)
    if (result.type === 'success') {
      setRegisteredEmail(data.email)
    } else {
      // Never reveal if email already exists — always show generic message
      setApiError('Não foi possível criar a conta. Verifique os dados e tente novamente.')
    }
  }

  async function handleResend() {
    if (!registeredEmail || resendStatus === 'loading') return
    setResendStatus('loading')
    await authService.resendConfirmation(registeredEmail)
    setResendStatus('sent')
  }

  if (registeredEmail) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <MailCheck className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Verifique seu e-mail</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para{' '}
          <span className="font-medium text-foreground">{registeredEmail}</span>.
          Clique no link para ativar sua conta.
        </p>
        <div className="pt-2">
          {resendStatus === 'sent' ? (
            <p className="text-sm text-green-600 font-medium">E-mail reenviado com sucesso.</p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendStatus === 'loading'}
            >
              {resendStatus === 'loading' ? 'Reenviando...' : 'Reenviar e-mail'}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Criar conta</h2>
        <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ana Silva"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="ana@exemplo.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a senha"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {apiError && (
          <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Criando conta...
            </span>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
