import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { PublicLayout } from '@/layouts/public-layout'
import { FormError } from './form-error'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      fullName: fullName.trim() ? undefined : 'Nome obrigatorio',
      email: email.trim() ? undefined : 'Email obrigatorio',
      password: password ? undefined : 'Senha obrigatoria',
    }
    setErrors(nextErrors)
    setFormError(null)

    if (nextErrors.fullName || nextErrors.email || nextErrors.password) {
      return
    }

    setSubmitting(true)
    try {
      await authApi.register({ fullName, email, password })
      setSuccess(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar a conta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                O link de confirmacao foi enviado para seu email.
              </p>
              <Link className="block text-sm font-medium text-emerald-800 hover:text-emerald-900" to="/login">
                Voltar para login
              </Link>
            </div>
          ) : (
            <form aria-label="Formulario de cadastro" className="space-y-4" onSubmit={handleSubmit}>
              <FormError message={formError} />
              <Input label="Nome" value={fullName} error={errors.fullName} onChange={(event) => setFullName(event.target.value)} />
              <Input label="Email" type="email" value={email} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
              <Input
                label="Senha"
                type="password"
                value={password}
                error={errors.password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? <Spinner label="Criando conta" /> : 'Criar conta'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
