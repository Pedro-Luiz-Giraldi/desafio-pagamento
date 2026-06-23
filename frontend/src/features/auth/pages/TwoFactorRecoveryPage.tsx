import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'

const schema = z.object({
  recoveryCode: z.string().min(1, 'Informe o código de recuperação'),
})
type Form = z.infer<typeof schema>

export default function TwoFactorRecoveryPage() {
  const { setTokens } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { twoFactorToken?: string; from?: string } | null
  const twoFactorToken = state?.twoFactorToken
  const from = state?.from ?? ROUTES.DASHBOARD

  const [apiError, setApiError] = useState<string | null>(null)
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null)

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
    const result = await authService.verify2FARecovery(data.recoveryCode, twoFactorToken)
    if (result.type === 'success') {
      setTokens(result.accessToken, result.user)
      setRemainingCodes(result.remainingCodes)
      // Brief delay to show the warning before redirecting
      setTimeout(() => navigate(from, { replace: true }), 3000)
    } else {
      setApiError('Código de recuperação inválido ou já utilizado.')
    }
  }

  if (!twoFactorToken) return null

  if (remainingCodes !== null) {
    return (
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-semibold">Código utilizado</h2>
        <p className="text-sm text-muted-foreground">
          Você usou um código de recuperação.{' '}
          {remainingCodes > 0 ? (
            <>
              Restam <span className="font-semibold text-foreground">{remainingCodes}</span>{' '}
              {remainingCodes === 1 ? 'código' : 'códigos'}.
            </>
          ) : (
            <span className="text-destructive font-medium">
              Não restam mais códigos. Configure o 2FA novamente após o acesso.
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">Redirecionando em instantes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Código de recuperação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use um dos códigos de recuperação gerados ao ativar o 2FA.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="recoveryCode">Código de recuperação</Label>
          <Input
            id="recoveryCode"
            type="text"
            placeholder="xxxx-xxxx-xxxx"
            autoComplete="off"
            className="font-mono"
            aria-invalid={!!errors.recoveryCode}
            {...register('recoveryCode')}
          />
          {errors.recoveryCode && (
            <p className="text-xs text-destructive">{errors.recoveryCode.message}</p>
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
              Verificando...
            </span>
          ) : (
            'Usar código'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          to={ROUTES.TWO_FACTOR_VERIFY}
          state={{ twoFactorToken, from }}
          className="text-primary font-medium hover:underline"
        >
          Voltar para o código TOTP
        </Link>
      </p>
    </div>
  )
}
