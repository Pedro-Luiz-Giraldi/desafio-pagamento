import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, Store } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@lib/constants'
import { cn } from '@/lib/utils'

type Role = 'CUSTOMER' | 'MERCHANT_OWNER'

function validateCnpj(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false
  const calc = (weights: number[]) =>
    weights.reduce((sum, w, i) => sum + Number(digits[i]) * w, 0) % 11
  const dv1 = calc([5,4,3,2,9,8,7,6,5,4,3,2]) < 2 ? 0 : 11 - calc([5,4,3,2,9,8,7,6,5,4,3,2])
  if (dv1 !== Number(digits[12])) return false
  const dv2 = calc([6,5,4,3,2,9,8,7,6,5,4,3,2]) < 2 ? 0 : 11 - calc([6,5,4,3,2,9,8,7,6,5,4,3,2])
  return dv2 === Number(digits[13])
}

function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

const baseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter número'),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
})
.refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof baseSchema>

const roleOptions: { value: Role; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'CUSTOMER',       label: 'Cliente',  description: 'Quero comprar produtos', icon: ShoppingBag },
  { value: 'MERCHANT_OWNER', label: 'Vendedor', description: 'Quero vender produtos',  icon: Store       },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [roleError, setRoleError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cnpjDisplay, setCnpjDisplay] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(baseSchema) })

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCnpj(e.target.value)
    setCnpjDisplay(masked)
    setValue('cnpj', masked.replace(/\D/g, ''))
  }

  async function onSubmit(data: RegisterForm) {
    if (!role) { setRoleError(true); return }

    if (role === 'MERCHANT_OWNER') {
      let hasError = false
      if (!data.companyName?.trim()) {
        setError('companyName', { message: 'Razão social é obrigatória' })
        hasError = true
      }
      const rawCnpj = data.cnpj?.replace(/\D/g, '') ?? ''
      if (!rawCnpj || !validateCnpj(rawCnpj)) {
        setError('cnpj', { message: 'CNPJ inválido' })
        hasError = true
      }
      if (hasError) return
    }

    setApiError(null)
    const merchantData = role === 'MERCHANT_OWNER'
      ? { companyName: data.companyName!, cnpj: data.cnpj!.replace(/\D/g, '') }
      : undefined

    const result = await authService.register(data.name, data.email, data.password, role, merchantData)
    if (result.type === 'success') {
      setRegisteredEmail(data.email)
    } else {
      setApiError('Não foi possível criar a conta. Verifique os dados e tente novamente.')
    }
  }

  async function handleResend() {
    if (!registeredEmail || resendStatus === 'loading') return
    setResendStatus('loading')
    setOtp(['', '', '', '', '', ''])
    setOtpError(null)
    await authService.resendConfirmation(registeredEmail)
    setResendStatus('sent')
    setTimeout(() => setResendStatus('idle'), 3000)
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    setOtpError(null)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) {
      setOtp(digits.split(''))
      setOtpError(null)
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  async function handleOtpSubmit() {
    const code = otp.join('')
    if (code.length < 6) { setOtpError('Digite os 6 dígitos'); return }
    setOtpSubmitting(true)
    setOtpError(null)
    const result = await authService.confirmEmail(registeredEmail!, code)
    setOtpSubmitting(false)
    if (result.type === 'success') {
      navigate(ROUTES.LOGIN, { state: { confirmed: true } })
    } else {
      setOtpError('Código incorreto ou expirado. Tente novamente.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    }
  }

  if (registeredEmail) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">Confirme sua conta</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para{' '}
            <span className="font-medium text-foreground">{registeredEmail}</span>
          </p>
        </div>

        {/* OTP input */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { otpRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className={cn(
                'w-11 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                digit ? 'border-primary bg-primary/5' : 'border-border bg-background',
                otpError && 'border-destructive',
              )}
            />
          ))}
        </div>

        {otpError && (
          <p className="text-center text-sm text-destructive">{otpError}</p>
        )}

        <Button className="w-full" onClick={handleOtpSubmit} disabled={otpSubmitting}>
          {otpSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Verificando...
            </span>
          ) : (
            'Confirmar conta'
          )}
        </Button>

        <div className="text-center space-y-2">
          {resendStatus === 'sent' ? (
            <p className="text-sm text-green-600 font-medium">Novo código enviado!</p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={resendStatus === 'loading'}>
              {resendStatus === 'loading' ? 'Reenviando...' : 'Reenviar código'}
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
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
        {/* Role selector */}
        <div className="space-y-1.5">
          <Label>Tipo de conta</Label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map(opt => {
              const Icon = opt.icon
              const selected = role === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setRole(opt.value); setRoleError(false) }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all',
                    selected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    roleError && 'border-destructive/40',
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.description}</span>
                </button>
              )
            })}
          </div>
          {roleError && <p className="text-xs text-destructive">Selecione o tipo de conta</p>}
        </div>

        {/* Merchant-only fields */}
        {role === 'MERCHANT_OWNER' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Razão social</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Empresa Ltda."
                aria-invalid={!!errors.companyName}
                {...register('companyName')}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpjDisplay}
                onChange={handleCnpjChange}
                aria-invalid={!!errors.cnpj}
              />
              {errors.cnpj && (
                <p className="text-xs text-destructive">{errors.cnpj.message}</p>
              )}
            </div>
          </>
        )}

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
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
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
