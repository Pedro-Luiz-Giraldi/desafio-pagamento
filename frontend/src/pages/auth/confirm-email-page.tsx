import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui'
import { PublicLayout } from '@/layouts/public-layout'
import { FormError } from './form-error'

export function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [error, setError] = useState<string | null>(token ? null : 'Token de confirmacao ausente')

  useEffect(() => {
    if (!token) {
      return
    }

    authApi
      .confirmEmail(token)
      .then(() => {
        setStatus('success')
        setError(null)
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Nao foi possivel confirmar o email')
      })
  }, [token])

  return (
    <PublicLayout>
      <Card>
        <CardHeader>
          <CardTitle>Confirmar email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && <Spinner label="Confirmando email" />}
          {status === 'success' && <p className="text-sm text-emerald-900">Email confirmado com sucesso</p>}
          {status === 'error' && <FormError message={error} />}
          <Link className="block text-sm font-medium text-emerald-800 hover:text-emerald-900" to="/login">
            Ir para login
          </Link>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
