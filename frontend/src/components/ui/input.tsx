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
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={descriptionId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'block min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950',
          'placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20',
          error && 'border-red-600 focus:border-red-600 focus:ring-red-600/20',
          className,
        )}
        {...props}
      />
      {(error || helperText) && (
        <p id={descriptionId} className={cn('text-sm', error ? 'text-red-700' : 'text-gray-600')}>
          {error ?? helperText}
        </p>
      )}
    </div>
  )
}
