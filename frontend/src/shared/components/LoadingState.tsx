import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner'
  rows?: number
}

export function LoadingState({ variant = 'skeleton', rows = 5 }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
