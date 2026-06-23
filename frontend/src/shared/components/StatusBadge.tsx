import { cn } from '@lib/utils'
import type { OrderStatus } from '@lib/types/orders.types'
import type { TransactionStatus } from '@lib/types/transactions.types'

type Status = OrderStatus | TransactionStatus

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  // Order statuses
  PENDING: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  PROCESSING: { label: 'Processando', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  PAID: { label: 'Pago', className: 'bg-green-50 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-red-50 text-red-800 border-red-200' },
  PARTIALLY_REFUNDED: { label: 'Parcialmente reembolsado', className: 'bg-orange-50 text-orange-800 border-orange-200' },
  // Transaction statuses
  APPROVED: { label: 'Aprovado', className: 'bg-green-50 text-green-800 border-green-200' },
  DECLINED: { label: 'Recusado', className: 'bg-red-50 text-red-800 border-red-200' },
  SUSPECTED_FRAUD: { label: 'Fraude suspeita', className: 'bg-red-50 text-red-800 border-red-200' },
  FULLY_REFUNDED: { label: 'Reembolsado', className: 'bg-gray-50 text-gray-700 border-gray-200' },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
