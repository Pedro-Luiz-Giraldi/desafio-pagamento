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
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={descriptionId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'block min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950',
          'focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20',
          error && 'border-red-600 focus:border-red-600 focus:ring-red-600/20',
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
        <p id={descriptionId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
