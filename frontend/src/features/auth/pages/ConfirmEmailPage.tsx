import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@lib/constants'

type Status = 'loading' | 'success' | 'error'

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    authService.confirmEmail(token).then(result => {
      setStatus(result.type === 'success' ? 'success' : 'error')
    })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="text-center space-y-3">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Confirmando seu e-mail...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-xl font-semibold">E-mail confirmado!</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta foi ativada com sucesso. Agora você pode fazer login.
        </p>
        <Button asChild className="w-full">
          <Link to={ROUTES.LOGIN}>Ir para o login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <XCircle className="h-12 w-12 text-destructive mx-auto" />
      <h2 className="text-xl font-semibold">Link inválido ou expirado</h2>
      <p className="text-sm text-muted-foreground">
        O link de confirmação é inválido ou já expirou.
      </p>
      <Button asChild variant="outline" className="w-full">
        <Link to={ROUTES.RESEND_CONFIRMATION}>Solicitar novo link</Link>
      </Button>
    </div>
  )
}
