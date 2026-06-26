import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { usersApi } from '@/api/users.api'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { PublicLayout } from '@/layouts/public-layout'
import { useAuthStore } from '@/stores/auth.store'
import { FormError } from './form-error'

export function TwoFactorPage() {
  const navigate = useNavigate()
  const { setLoading, setToken, setTwoFactorToken, setUser, twoFactorToken } = useAuthStore()
  const completedRef = useRef(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!twoFactorToken && !completedRef.current) {
      navigate('/login')
    }
  }, [navigate, twoFactorToken])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!code.trim()) {
      setCodeError('Codigo obrigatorio')
      return
    }
    setCodeError(undefined)

    if (!twoFactorToken) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    setLoading(true)
    try {
      const response = await authApi.verifyTwoFactor({ twoFactorToken, totpCode: code })
      completedRef.current = true
      setToken(response.accessToken ?? null)
      setTwoFactorToken(null)
      
      // Fetch user profile after successful 2FA verification
      try {
        const userProfile = await usersApi.getProfile()
        setUser(userProfile)
      } catch (profileError) {
        console.error('Failed to fetch user profile:', profileError)
      }
      
      navigate('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel verificar o codigo')
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <Card>
        <CardHeader>
          <CardTitle>Verificacao 2FA</CardTitle>
        </CardHeader>
        <CardContent>
          <form aria-label="Formulario de 2FA" className="space-y-4" onSubmit={handleSubmit}>
            <FormError message={formError} />
            <Input label="Codigo TOTP" inputMode="numeric" value={code} error={codeError} onChange={(event) => setCode(event.target.value)} />
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? <Spinner label="Verificando" /> : 'Verificar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
