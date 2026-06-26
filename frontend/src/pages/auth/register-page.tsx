import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { authApi } from '@/api/auth.api'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { PublicLayout } from '@/layouts/public-layout'
import { cleanCnpj, formatCnpj, validateCnpjChecksum, validateCnpjFormat } from '@/utils/validation'
import { FormError } from './form-error'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    companyName?: string
    cnpj?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleCnpjChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCnpj(event.target.value)
    setCnpj(formatted)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Validate CNPJ
    let cnpjError: string | undefined
    if (!cnpj.trim()) {
      cnpjError = 'CNPJ obrigatorio'
    } else if (!validateCnpjFormat(cnpj)) {
      cnpjError = 'CNPJ invalido (use XX.XXX.XXX/XXXX-XX)'
    } else if (!validateCnpjChecksum(cnpj)) {
      cnpjError = 'CNPJ invalido'
    }

    const nextErrors = {
      fullName: fullName.trim() ? undefined : 'Nome obrigatorio',
      email: email.trim() ? undefined : 'Email obrigatorio',
      password: password ? undefined : 'Senha obrigatoria',
      companyName: companyName.trim() ? undefined : 'Nome da empresa obrigatorio',
      cnpj: cnpjError,
    }
    setErrors(nextErrors)
    setFormError(null)

    if (nextErrors.fullName || nextErrors.email || nextErrors.password || nextErrors.companyName || nextErrors.cnpj) {
      return
    }

    setSubmitting(true)
    try {
      await authApi.register({
        fullName,
        email,
        password,
        companyName,
        cnpj: cleanCnpj(cnpj),
      })
      setSuccess(true)
    } catch (error) {
      // Handle Axios error with response data
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data

        // Check for field-specific errors from backend
        if (data.errors) {
          setErrors({
            companyName: data.errors.companyName ? 'Nome da empresa invalido' : undefined,
            cnpj: data.errors.cnpj ? 'CNPJ invalido ou ja cadastrado' : undefined,
            email: data.errors.email ? 'Email invalido ou ja cadastrado' : undefined,
          })
          setFormError('Corrija os erros abaixo')
        } else {
          setFormError(data.detail || data.message || 'Nao foi possivel criar a conta')
        }
      } else {
        setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar a conta')
      }
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
              <Input
                label="Nome da Empresa"
                value={companyName}
                error={errors.companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Ex: Loja da Ana"
              />
              <Input
                label="CNPJ"
                value={cnpj}
                error={errors.cnpj}
                onChange={handleCnpjChange}
                placeholder="XX.XXX.XXX/XXXX-XX"
                maxLength={18}
              />
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
