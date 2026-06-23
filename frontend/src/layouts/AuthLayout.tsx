import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@lib/constants'

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  // Redirect already-authenticated users away from auth pages
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Acabou o Mony</h1>
          <p className="text-muted-foreground text-sm mt-1">Pagamentos para quem empreende</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
