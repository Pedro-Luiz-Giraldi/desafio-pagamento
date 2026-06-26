import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@lib/constants'
import { Shield } from 'lucide-react'

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[420px] flex-none bg-[#13141f] flex-col justify-between p-10">
        <div>
          <span className="text-xl font-bold text-emerald-400 tracking-tight">Acabou o Mony</span>
          <p className="text-white/30 text-xs mt-0.5 uppercase tracking-wide">Gateway de Pagamentos</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white leading-snug">
              Pagamentos rápidos,<br />seguros e confiáveis.
            </h2>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              Processe transações com detecção de fraude em tempo real e confirmação instantânea.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Antifraude com ML em tempo real',
              'Processamento via Mercado Pago',
              'Idempotência garantida',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-none">
                  <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/20 text-xs">
          <Shield className="h-3.5 w-3.5" />
          PCI DSS Level 1 · TLS 1.3 · AES-256
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <span className="text-xl font-bold text-primary">Acabou o Mony</span>
            <p className="text-muted-foreground text-sm mt-1">Gateway de Pagamentos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
