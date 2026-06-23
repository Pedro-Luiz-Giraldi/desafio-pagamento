import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@lib/constants'
import { cn } from '@lib/utils'
import type { UserRole } from '@lib/types/auth.types'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Meus Pedidos', to: ROUTES.ORDERS, icon: ShoppingBag },
    { label: 'Perfil', to: ROUTES.PROFILE, icon: User },
  ],
  MERCHANT_OWNER: [
    { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Pedidos', to: ROUTES.ORDERS, icon: ShoppingCart },
    { label: 'Transações', to: ROUTES.TRANSACTIONS, icon: CreditCard },
    { label: 'Perfil', to: ROUTES.PROFILE, icon: User },
  ],
  STAFF: [
    { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Transações', to: ROUTES.TRANSACTIONS, icon: CreditCard },
    { label: 'Perfil', to: ROUTES.PROFILE, icon: User },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Cliente',
  MERCHANT_OWNER: 'Merchant',
  STAFF: 'Staff',
}

export function AppLayout() {
  const { user, role, logout } = useAuth()
  const navItems = role ? NAV_ITEMS[role] : []
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Sidebar */}
      <aside className="w-60 flex-none bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b">
          <span className="text-lg font-bold text-primary tracking-tight">Acabou o Mony</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-none" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{role ? ROLE_LABELS[role] : ''}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => void logout()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
