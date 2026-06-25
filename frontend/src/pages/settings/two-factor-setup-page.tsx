import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { toast } from '@/lib/toast-store'
import { usersApi } from '@/api/users.api'
import type { TwoFactorSetupResponse } from '@/types/auth'

export function TwoFactorSetupPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [step, setStep] = useState<'idle' | 'setup' | 'confirm' | 'done'>(user?.twoFactorEnabled ? 'done' : 'idle')
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    setLoading(true)
    try {
      const response = await usersApi.setupTwoFactor()
      setSetupData(response.data)
      setStep('setup')
    } catch {
      toast.error('Erro ao configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!totpCode || totpCode.length < 6) {
      toast.error('Código TOTP inválido')
      return
    }
    setLoading(true)
    try {
      await usersApi.confirmTwoFactor(totpCode)
      toast.success('2FA ativado com sucesso')
      setStep('done')
    } catch {
      toast.error('Código inválido. Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    try {
      await usersApi.disableTwoFactor()
      toast.success('2FA desativado')
      navigate('/settings')
    } catch {
      toast.error('Erro ao desativar 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Autenticação de Dois Fatores</h2>
        <Button variant="secondary" onClick={() => navigate('/settings')}>Voltar</Button>
      </div>

      {step === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar 2FA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              O 2FA adiciona uma camada extra de segurança à sua conta.
              Você precisará de um aplicativo de autenticação como Google Authenticator ou Authy.
            </p>
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? <Spinner label="Preparando" /> : 'Começar Configuração'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'setup' && setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Escaneie o QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img src={setupData.qrCodeUrl} alt="QR Code para configurar 2FA" className="rounded-md border border-gray-200" />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Ou insira manualmente a chave no seu aplicativo:
            </p>
            <p className="text-center font-mono text-xs text-gray-500 bg-gray-50 rounded-md p-2">{setupData.secret}</p>

            <div className="space-y-3">
              <Input
                label="Código de Verificação"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
              />
              <Button className="w-full" onClick={handleConfirm} disabled={loading}>
                {loading ? <Spinner label="Verificando" /> : 'Verificar e Ativar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && setupData && (
        <Card>
          <CardHeader>
            <CardTitle>2FA Ativado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Importante:</strong> Guarde estes códigos de recuperação em um local seguro.
              Eles são a única forma de recuperar acesso à sua conta caso perca o acesso ao seu aplicativo de autenticação.
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Códigos de Recuperação:</p>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-gray-50 p-3">
                {setupData.recoveryCodes.map((code, idx) => (
                  <code key={idx} className="text-xs font-mono text-gray-700">{code}</code>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => navigate('/settings')}>
              Concluir
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'done' && !setupData && (
        <Card>
          <CardHeader>
            <CardTitle>2FA Ativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              A autenticação de dois fatores está ativa na sua conta.
            </p>
            <Button variant="danger" onClick={handleDisable} disabled={loading}>
              {loading ? <Spinner label="Desativando" /> : 'Desativar 2FA'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
