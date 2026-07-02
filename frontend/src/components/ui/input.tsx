import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export function Input({ className, error, helperText, id, label, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = error || helperText ? `${inputId}-description` : undefined

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={descriptionId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900',
          'placeholder:text-slate-400 transition-smooth',
          'focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20',
          error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
          className,
        )}
        {...props}
      />
      {(error || helperText) && (
        <p id={descriptionId} className={cn('text-xs', error ? 'text-[#EF4444]' : 'text-slate-500')}>
          {error ?? helperText}
        </p>
      )}
    </div>
  )
}
