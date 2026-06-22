import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { subscribe, getSnapshot } from '@/lib/toast-store'

type ToastType = 'success' | 'error' | 'info'

const variants: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))] space-y-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.type === 'error' ? 'alert' : 'status'}
          className={cn('rounded-md border px-4 py-3 text-sm shadow-sm', variants[item.type])}
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}

