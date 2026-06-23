import { InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ message = 'Nenhum item encontrado.', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
