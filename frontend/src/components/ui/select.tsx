import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
}

export function Select({ className, error, id, label, options, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const descriptionId = error ? `${selectId}-error` : undefined

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={descriptionId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900',
          'transition-smooth focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20',
          error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={descriptionId} className="text-xs text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  )
}
