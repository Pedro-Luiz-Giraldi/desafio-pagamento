import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui'
import { toast } from '@/lib/toast-store'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Pedidos', icon: '📦', path: '/orders' },
  { label: 'Transações', icon: '💳', path: '/transactions' },
  { label: 'Configurações', icon: '⚙️', path: '/settings' },
]

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clear)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-indigo-600">Acabou o Mony</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          v1.0.0 — MVP
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 md:hidden">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
              <span className="text-xl font-bold text-indigo-600">Acabou o Mony</span>
              <button
                onClick={closeMobileMenu}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
              v1.0.0 — MVP
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-gray-700 hover:text-gray-900 p-2"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900 hidden md:block">Dashboard</h1>
          <span className="text-lg font-bold text-indigo-600 md:hidden">Acabou o Mony</span>

          {/* User Menu */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user?.fullName || 'Usuário'}</div>
              <div className="text-xs text-gray-500">{user?.email || ''}</div>
            </div>
            <Button variant="secondary" onClick={handleLogout} className="text-sm">
              Sair
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
