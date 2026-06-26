import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@lib/constants'

export default function ConfirmEmailPage() {
  return (
    <div className="text-center space-y-4">
      <Mail className="h-12 w-12 text-primary mx-auto" />
      <h2 className="text-xl font-semibold">Confirmação por código</h2>
      <p className="text-sm text-muted-foreground">
        A confirmação de e-mail é feita pelo código de 6 dígitos enviado durante o cadastro.
      </p>
      <Button asChild className="w-full">
        <Link to={ROUTES.LOGIN}>Ir para o login</Link>
      </Button>
    </div>
  )
}
