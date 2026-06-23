import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@features/profile/services/profileService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@lib/constants'

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Cliente',
  MERCHANT_OWNER: 'Comerciante',
  STAFF: 'Staff',
}

const nameSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
})
type NameForm = z.infer<typeof nameSchema>

export default function ProfilePage() {
  const { user, refreshToken } = useAuth()

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  useEffect(() => {
    if (user) reset({ name: user.name })
  }, [user, reset])

  async function onSubmit(data: NameForm) {
    setSaveError(null)
    setSaveSuccess(false)
    const result = await profileService.updateProfile({ name: data.name })
    if (result.ok) {
      await refreshToken()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } else {
      setSaveError('Não foi possível salvar as alterações. Tente novamente.')
    }
  }

  if (!user) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais.</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Função</span>
            <span className="font-medium">{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit name */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {saveError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Perfil atualizado com sucesso.
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      {/* 2FA card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          {user.twoFactorEnabled ? (
            <ShieldCheck className="h-8 w-8 text-green-500 flex-none" />
          ) : (
            <ShieldOff className="h-8 w-8 text-muted-foreground flex-none" />
          )}
          <div>
            <CardTitle className="text-base">
              Autenticação em duas etapas
            </CardTitle>
            <CardDescription>
              {user.twoFactorEnabled
                ? '2FA ativo — sua conta está protegida.'
                : '2FA inativo — ative para maior segurança.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant={user.twoFactorEnabled ? 'outline' : 'default'}>
            <Link to={ROUTES.PROFILE_2FA}>
              {user.twoFactorEnabled ? 'Gerenciar 2FA' : 'Ativar 2FA'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
