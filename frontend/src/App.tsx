import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui'
import { ConfirmEmailPage } from '@/pages/auth/confirm-email-page'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { TwoFactorPage } from '@/pages/auth/two-factor-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/2fa-verify" element={<TwoFactorPage />} />
        <Route path="/" element={<div className="flex h-screen items-center justify-center text-xl font-semibold text-gray-600">Acabou o Mony</div>} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
