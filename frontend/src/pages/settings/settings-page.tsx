import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { toast } from '@/lib/toast-store'
import { usersApi } from '@/api/users.api'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName)
    }
  }, [user?.fullName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!fullName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      await usersApi.updateProfile({ fullName: fullName.trim() })
      toast.success('Perfil atualizado com sucesso')
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form aria-label="Formulario de perfil" className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Email" type="email" value={user?.email ?? ''} disabled />
            <Input label="Nome Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner label="Salvando" /> : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Autenticação de Dois Fatores (2FA)</p>
              <p className="text-sm text-gray-500">
                {user?.twoFactorEnabled ? '2FA está ativo' : 'Adicione uma camada extra de segurança'}
              </p>
            </div>
            <Button variant={user?.twoFactorEnabled ? 'secondary' : 'primary'} onClick={() => navigate('/settings/2fa')}>
              {user?.twoFactorEnabled ? 'Gerenciar' : 'Configurar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
