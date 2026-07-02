import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex max-w-full items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', variants[variant], className)}
      {...props}
    />
  )
}
