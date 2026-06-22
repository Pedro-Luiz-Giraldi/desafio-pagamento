import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function Spinner({ className, label = 'Carregando', ...props }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex items-center', className)} {...props}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-700" />
    </div>
  )
}
