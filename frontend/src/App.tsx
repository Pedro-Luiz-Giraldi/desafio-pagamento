import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui'
import { ProtectedRoute } from '@/components/protected-route'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'
import { ConfirmEmailPage } from '@/pages/auth/confirm-email-page'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { TwoFactorPage } from '@/pages/auth/two-factor-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/2fa-verify" element={<TwoFactorPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <div className="text-center text-gray-600">Pedidos — Em desenvolvimento</div>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <div className="text-center text-gray-600">Transações — Em desenvolvimento</div>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <div className="text-center text-gray-600">Configurações — Em desenvolvimento</div>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
