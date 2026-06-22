import type { ReactNode } from 'react'
import { APP_NAME } from '@/lib/constants'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-800">{APP_NAME}</p>
          <h1 className="mt-2 text-2xl font-semibold">Acesso merchant</h1>
        </div>
        {children}
      </div>
    </main>
  )
}
