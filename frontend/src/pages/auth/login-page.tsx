import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { usersApi } from '@/api/users.api'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { PublicLayout } from '@/layouts/public-layout'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/lib/toast-store'
import { FormError } from './form-error'

export function LoginPage() {
  const navigate = useNavigate()
  const { setLoading, setToken, setTwoFactorToken, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      email: email.trim() ? undefined : 'Email obrigatorio',
      password: password ? undefined : 'Senha obrigatoria',
    }
    setErrors(nextErrors)
    setFormError(null)

    if (nextErrors.email || nextErrors.password) {
      return
    }

    setSubmitting(true)
    setLoading(true)
    try {
      const response = await authApi.login({ email, password })
      if (response.requiresTwoFactor) {
        setTwoFactorToken(response.twoFactorToken ?? null)
        navigate('/2fa-verify')
        return
      }
      const token = response.accessToken ?? null
      console.log('[LoginPage] Setting token:', token ? 'Token received' : 'No token')
      setToken(token)
      setTwoFactorToken(null)
      
      // Fetch user profile after successful login
      let userProfile = null
      try {
        console.log('[LoginPage] Fetching user profile...')
        userProfile = await usersApi.getProfile()
        console.log('[LoginPage] Profile response:', userProfile)
        setUser(userProfile)
        console.log('[LoginPage] User set in store:', userProfile)
      } catch (profileError) {
        console.error('[LoginPage] Failed to fetch user profile:', profileError)
        toast.error('Erro ao carregar perfil do usuário')
      }

      // Redirect based on role
      const redirectTo = userProfile?.role === 'CUSTOMER' ? '/client/dashboard' : '/'
      navigate(redirectTo)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel autenticar')
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form aria-label="Formulario de login" className="space-y-4" onSubmit={handleSubmit}>
            <FormError message={formError} />
            <Input label="Email" type="email" value={email} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
            <Input
              label="Senha"
              type="password"
              value={password}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? <Spinner label="Entrando" /> : 'Entrar'}
            </Button>
            <Link className="block text-center text-sm font-medium text-[#1A56DB] hover:text-[#0A2540]" to="/register">
              Criar conta merchant
            </Link>
          </form>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
