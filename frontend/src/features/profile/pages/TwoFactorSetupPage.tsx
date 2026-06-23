import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, ShieldOff, Copy, CheckCheck } from 'lucide-react'
import { authService } from '@features/auth/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const codeSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
})
const passwordSchema = z.object({ password: z.string().min(1, 'Senha obrigatória') })

type SetupStep = 'idle' | 'qrcode' | 'recoveryCodes'
type CodeForm = z.infer<typeof codeSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function TwoFactorSetupPage() {
  const { user, refreshToken } = useAuth()
  const is2FAEnabled = user?.twoFactorEnabled ?? false

  const [step, setStep] = useState<SetupStep>('idle')
  const [qrData, setQrData] = useState<{ qrCodeUrl: string; secret: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [setupError, setSetupError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disableError, setDisableError] = useState<string | null>(null)

  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  async function handleStartSetup() {
    setSetupError(null)
    const data = await authService.setup2FA()
    if (!data) {
      setSetupError('Não foi possível iniciar o 2FA. Tente novamente.')
      return
    }
    setQrData(data)
    setStep('qrcode')
  }

  async function handleConfirmCode(data: CodeForm) {
    setSetupError(null)
    const result = await authService.confirm2FA(data.code)
    if (!result) {
      setSetupError('Código inválido. Verifique o app autenticador e tente novamente.')
      return
    }
    setRecoveryCodes(result.recoveryCodes)
    setStep('recoveryCodes')
  }

  async function handleFinishSetup() {
    await refreshToken()
    setStep('idle')
    setQrData(null)
    setRecoveryCodes([])
  }

  async function handleDisable(data: PasswordForm) {
    setDisableError(null)
    const ok = await authService.disable2FA(data.password)
    if (!ok) {
      setDisableError('Senha incorreta. Tente novamente.')
      return
    }
    await refreshToken()
    setShowDisableDialog(false)
    passwordForm.reset()
  }

  async function copyAllCodes() {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'qrcode' && qrData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Ativar autenticação em duas etapas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escaneie o QR code com o Google Authenticator ou Authy.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl border">
          <QRCodeSVG value={qrData.qrCodeUrl} size={200} />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ou adicione manualmente:</p>
            <p className="font-mono text-sm mt-1 bg-muted px-3 py-1.5 rounded select-all">
              {qrData.secret}
            </p>
          </div>
        </div>

        <form onSubmit={codeForm.handleSubmit(handleConfirmCode)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="code">Código do app autenticador</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="text-center text-xl tracking-widest font-mono"
              {...codeForm.register('code')}
            />
            {codeForm.formState.errors.code && (
              <p className="text-xs text-destructive">{codeForm.formState.errors.code.message}</p>
            )}
          </div>

          {setupError && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {setupError}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep('idle')} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={codeForm.formState.isSubmitting}>
              {codeForm.formState.isSubmitting ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (step === 'recoveryCodes') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Guarde seus códigos de recuperação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estes códigos são exibidos uma única vez. Guarde em local seguro.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-2">
            {recoveryCodes.map(code => (
              <p key={code} className="font-mono text-sm text-center py-1 bg-white rounded border">
                {code}
              </p>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={copyAllCodes}>
          {copied ? (
            <>
              <CheckCheck className="h-4 w-4 text-green-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar todos os códigos
            </>
          )}
        </Button>

        <Button className="w-full" onClick={handleFinishSetup}>
          Confirmei que salvei os códigos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Autenticação em duas etapas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione uma camada extra de segurança à sua conta.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          {is2FAEnabled ? (
            <ShieldCheck className="h-8 w-8 text-green-500 flex-none" />
          ) : (
            <ShieldOff className="h-8 w-8 text-muted-foreground flex-none" />
          )}
          <div>
            <CardTitle className="text-base">
              {is2FAEnabled ? '2FA ativo' : '2FA inativo'}
            </CardTitle>
            <CardDescription>
              {is2FAEnabled
                ? 'Sua conta está protegida com autenticação em duas etapas.'
                : 'Ative para proteger sua conta com um segundo fator.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {is2FAEnabled ? (
            <Button
              variant="destructive"
              onClick={() => setShowDisableDialog(true)}
            >
              Desativar 2FA
            </Button>
          ) : (
            <Button onClick={handleStartSetup}>
              Ativar 2FA
            </Button>
          )}
          {setupError && (
            <p className="text-xs text-destructive mt-2">{setupError}</p>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA dialog with password */}
      {showDisableDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">Confirmar desativação</h3>
            <p className="text-sm text-muted-foreground">
              Digite sua senha para desativar o 2FA.
            </p>
            <form onSubmit={passwordForm.handleSubmit(handleDisable)} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="disable-password">Senha atual</Label>
                <Input
                  id="disable-password"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('password')}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {disableError && (
                <p className="text-xs text-destructive">{disableError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDisableDialog(false)
                    passwordForm.reset()
                    setDisableError(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="flex-1"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting ? 'Desativando...' : 'Desativar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
