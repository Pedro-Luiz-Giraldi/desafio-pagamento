import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 py-12 text-center">
          <div className="text-6xl">🔍</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Página não encontrada</h1>
            <p className="text-gray-600">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/')}>Voltar à Home</Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
