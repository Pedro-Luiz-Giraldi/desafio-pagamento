import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type LoginForm = z.infer<typeof loginSchema>

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_NOT_CONFIRMED: 'Confirme seu e-mail antes de acessar.',
  ACCOUNT_LOCKED: 'Conta bloqueada. Entre em contato com o suporte.',
  RATE_LIMIT: 'Muitas tentativas. Aguarde antes de tentar novamente.',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? ROUTES.DASHBOARD

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setApiError(null)
    setIsEmailNotConfirmed(false)

    const result = await login(data.email, data.password)

    if ('success' in result && result.success) {
      navigate(from, { replace: true })
      return
    }

    if ('twoFactorRequired' in result && result.twoFactorRequired) {
      navigate(ROUTES.TWO_FACTOR_VERIFY, {
        state: { twoFactorToken: result.twoFactorToken, from },
      })
      return
    }

    if ('error' in result) {
      if (result.errorCode === 'EMAIL_NOT_CONFIRMED') setIsEmailNotConfirmed(true)
      setApiError(LOGIN_ERRORS[result.errorCode] ?? 'Ocorreu um erro inesperado.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Entrar</h2>
        <p className="text-sm text-muted-foreground mt-1">Acesse sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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

        {apiError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {apiError}
            {isEmailNotConfirmed && (
              <>
                {' '}
                <Link
                  to={ROUTES.RESEND_CONFIRMATION}
                  className="underline font-medium hover:no-underline"
                >
                  Reenviar confirmação
                </Link>
              </>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
