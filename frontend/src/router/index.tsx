import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { RoleRoute } from './RoleRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ROUTES } from '@lib/constants'

import LoginPage from '@features/auth/pages/LoginPage'
import RegisterPage from '@features/auth/pages/RegisterPage'
import ConfirmEmailPage from '@features/auth/pages/ConfirmEmailPage'
import ResendConfirmationPage from '@features/auth/pages/ResendConfirmationPage'
import TwoFactorVerifyPage from '@features/auth/pages/TwoFactorVerifyPage'
import TwoFactorRecoveryPage from '@features/auth/pages/TwoFactorRecoveryPage'

import DashboardPage from '@features/dashboard/pages/DashboardPage'
import ProfilePage from '@features/profile/pages/ProfilePage'
import TwoFactorSetupPage from '@features/profile/pages/TwoFactorSetupPage'

import OrdersListPage from '@features/orders/pages/OrdersListPage'
import NewOrderPage from '@features/orders/pages/NewOrderPage'
import OrderDetailPage from '@features/orders/pages/OrderDetailPage'
import PaymentPage from '@features/orders/pages/PaymentPage'

import TransactionsListPage from '@features/transactions/pages/TransactionsListPage'
import TransactionDetailPage from '@features/transactions/pages/TransactionDetailPage'
import RefundPage from '@features/transactions/pages/RefundPage'

import ProductsListPage from '@features/products/pages/ProductsListPage'
import CheckoutPage from '@features/checkout/pages/CheckoutPage'

export const router = createBrowserRouter([
  // Public standalone pages
  { path: ROUTES.CHECKOUT, element: <CheckoutPage /> },

  // Auth routes (public, redirect if already logged in)
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.CONFIRM_EMAIL, element: <ConfirmEmailPage /> },
      { path: ROUTES.RESEND_CONFIRMATION, element: <ResendConfirmationPage /> },
      { path: ROUTES.TWO_FACTOR_VERIFY, element: <TwoFactorVerifyPage /> },
      { path: ROUTES.TWO_FACTOR_RECOVERY, element: <TwoFactorRecoveryPage /> },
    ],
  },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redirect root to dashboard
          { path: '/', element: <Navigate to={ROUTES.DASHBOARD} replace /> },

          // Common routes (all authenticated roles)
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.PROFILE, element: <ProfilePage /> },
          { path: ROUTES.PROFILE_2FA, element: <TwoFactorSetupPage /> },

          // CUSTOMER-only routes
          {
            element: <RoleRoute allowedRoles={['CUSTOMER']} />,
            children: [
              { path: ROUTES.NEW_ORDER, element: <NewOrderPage /> },
              { path: ROUTES.PAYMENT, element: <PaymentPage /> },
            ],
          },

          // MERCHANT_OWNER-only routes
          {
            element: <RoleRoute allowedRoles={['MERCHANT_OWNER']} />,
            children: [
              { path: ROUTES.PRODUCTS, element: <ProductsListPage /> },
              { path: ROUTES.TRANSACTIONS, element: <TransactionsListPage /> },
              { path: ROUTES.TRANSACTION_DETAIL, element: <TransactionDetailPage /> },
              { path: ROUTES.REFUND, element: <RefundPage /> },
            ],
          },

          // Shared orders routes (CUSTOMER + MERCHANT_OWNER)
          {
            element: <RoleRoute allowedRoles={['CUSTOMER', 'MERCHANT_OWNER']} />,
            children: [
              { path: ROUTES.ORDERS, element: <OrdersListPage /> },
              { path: ROUTES.ORDER_DETAIL, element: <OrderDetailPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])
