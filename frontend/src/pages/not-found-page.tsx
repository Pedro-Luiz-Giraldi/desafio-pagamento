import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#0A2540]">Página não encontrada</h1>
            <p className="text-sm text-slate-600">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-2">
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
