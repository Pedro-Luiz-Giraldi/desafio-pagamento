import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@lib/constants'
import type { UserRole } from '@lib/types/auth.types'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role } = useAuth()

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
