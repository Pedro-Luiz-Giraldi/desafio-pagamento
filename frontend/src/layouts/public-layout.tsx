import type { ReactNode } from 'react'
import { APP_NAME } from '@/lib/constants'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#0A2540] tracking-tight">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-600">Acesso à plataforma de pagamentos</p>
        </div>
        {children}
      </div>
    </main>
  )
}
