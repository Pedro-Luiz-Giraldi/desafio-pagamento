import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui'
import { ProtectedRoute } from '@/components/protected-route'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'
import { ConfirmEmailPage } from '@/pages/auth/confirm-email-page'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { TwoFactorPage } from '@/pages/auth/two-factor-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { OrdersListPage } from '@/pages/orders/orders-list-page'
import { OrderCreatePage } from '@/pages/orders/order-create-page'
import { OrderDetailPage } from '@/pages/orders/order-detail-page'
import { TransactionsListPage } from '@/pages/transactions/transactions-list-page'
import { TransactionDetailPage } from '@/pages/transactions/transaction-detail-page'
import { SettingsPage } from '@/pages/settings/settings-page'
import { TwoFactorSetupPage } from '@/pages/settings/two-factor-setup-page'
import { ClientDashboardPage } from '@/pages/client/client-dashboard-page'
import { MerchantsListPage } from '@/pages/client/merchants-list-page'
import { MerchantDetailPage } from '@/pages/client/merchant-detail-page'
import { ProductsPage } from '@/pages/merchant/products-page'
import { PayOrderPage } from '@/pages/client/pay-order-page'
import { NotFoundPage } from '@/pages/not-found-page'

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
                <OrdersListPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/new"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <AuthenticatedLayout>
                <OrderCreatePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <OrderDetailPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TransactionsListPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TransactionDetailPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <SettingsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/2fa"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TwoFactorSetupPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Client Routes */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <AuthenticatedLayout>
                <ClientDashboardPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchants"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <AuthenticatedLayout>
                <MerchantsListPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchants/:id"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <AuthenticatedLayout>
                <MerchantDetailPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
          <Route
            path="/pay/:orderId"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <AuthenticatedLayout>
                  <PayOrderPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />


        {/* Merchant Routes */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['MERCHANT_OWNER']}>
              <AuthenticatedLayout>
                <ProductsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
