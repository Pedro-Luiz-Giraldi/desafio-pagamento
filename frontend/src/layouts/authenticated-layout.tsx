import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui'
import { toast } from '@/lib/toast-store'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

// SVG icon components for clean, professional navigation
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const OrdersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const TransactionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const ProductsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const StoresIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const merchantMenuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/' },
  { label: 'Pedidos', icon: OrdersIcon, path: '/orders' },
  { label: 'Transacoes', icon: TransactionsIcon, path: '/transactions' },
  { label: 'Produtos', icon: ProductsIcon, path: '/products' },
  { label: 'Configuracoes', icon: SettingsIcon, path: '/settings' },
]

const clientMenuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/' },
  { label: 'Meus Pedidos', icon: OrdersIcon, path: '/orders' },
  { label: 'Minhas Transacoes', icon: TransactionsIcon, path: '/transactions' },
  { label: 'Lojas', icon: StoresIcon, path: '/merchants' },
  { label: 'Configuracoes', icon: SettingsIcon, path: '/settings' },
]

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clear)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = user?.role === 'CUSTOMER' ? clientMenuItems : merchantMenuItems

  const handleLogout = async () => {
    try {
      await authApi.logout()
      clearAuth()
      navigate('/login')
      toast.success('Logout realizado com sucesso')
    } catch (error) {
      // Even if API call fails, clear local state and redirect
      clearAuth()
      navigate('/login')
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-6 border-b border-slate-200">
          <span className="text-lg font-bold text-[#0A2540] tracking-tight">Acabou o Mony</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive
                      ? 'bg-[#0A2540] text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
          {user?.role === 'CUSTOMER' && (
            <NavLink
              to="/orders/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#1A56DB] text-white hover:bg-[#0A2540] transition-smooth mt-4"
            >
              <PlusIcon />
              <span>Novo Pedido</span>
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-mono">v1.0.0</div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 md:hidden">
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200">
              <span className="text-lg font-bold text-[#0A2540] tracking-tight">Acabou o Mony</span>
              <button
                onClick={closeMobileMenu}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Fechar menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                        isActive
                          ? 'bg-[#0A2540] text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
              {user?.role === 'CUSTOMER' && (
                <NavLink
                  to="/orders/new"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#1A56DB] text-white hover:bg-[#0A2540] transition-smooth mt-4"
                >
                  <PlusIcon />
                  <span>Novo Pedido</span>
                </NavLink>
              )}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="text-xs text-slate-500 font-mono">v1.0.0</div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-2 -ml-2"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="text-base font-bold text-[#0A2540] tracking-tight md:hidden">Acabou o Mony</span>
          <div className="hidden md:block" />

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.fullName || 'Usuário'}</div>
              <div className="text-xs text-slate-500">{user?.email || ''}</div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-sm">
              Sair
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
