import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#0A2540] text-white hover:bg-[#1A56DB] shadow-sm',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-[#EF4444] text-white hover:bg-red-600 shadow-sm',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

export function Button({ className, variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-smooth',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB]',
        'disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
