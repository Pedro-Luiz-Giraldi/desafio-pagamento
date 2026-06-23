import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authService } from '@features/auth/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const schema = z.object({
  code: z
    .string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d+$/, 'Apenas números'),
})
type Form = z.infer<typeof schema>

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining(r => r - 1), 1000)
    return () => clearInterval(id)
  }, [remaining])
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return { remaining, display: `${m}:${s.toString().padStart(2, '0')}`, expired: remaining <= 0 }
}

export default function TwoFactorVerifyPage() {
  const { setTokens } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { twoFactorToken?: string; from?: string } | null
  const twoFactorToken = state?.twoFactorToken
  const from = state?.from ?? ROUTES.DASHBOARD

  const { display, expired } = useCountdown(300) // 5 minutes
  const [apiError, setApiError] = useState<string | null>(null)

  // Redirect if no token (user navigated directly)
  useEffect(() => {
    if (!twoFactorToken) navigate(ROUTES.LOGIN, { replace: true })
  }, [twoFactorToken, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    if (!twoFactorToken) return
    setApiError(null)
    const result = await authService.verify2FA(data.code, twoFactorToken)
    if (result.type === 'success') {
      setTokens(result.accessToken, result.user)
      navigate(from, { replace: true })
    } else {
      setApiError('Código inválido ou expirado. Tente novamente.')
    }
  }

  if (!twoFactorToken) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Verificação em duas etapas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Abra o app autenticador e insira o código de 6 dígitos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="code">Código TOTP</Label>
            <span className={`text-xs font-mono ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {expired ? 'Expirado' : display}
            </span>
          </div>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-xl tracking-widest font-mono"
            aria-invalid={!!errors.code}
            disabled={expired}
            {...register('code')}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>

        {apiError && (
          <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        {expired && (
          <div role="alert" className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            O tempo expirou.{' '}
            <Link to={ROUTES.LOGIN} className="font-medium underline">
              Faça login novamente.
            </Link>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || expired}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Verificando...
            </span>
          ) : (
            'Verificar'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Perdeu o acesso ao app?{' '}
        <Link
          to={ROUTES.TWO_FACTOR_RECOVERY}
          state={{ twoFactorToken, from }}
          className="text-primary font-medium hover:underline"
        >
          Usar código de recuperação
        </Link>
      </p>
    </div>
  )
}
