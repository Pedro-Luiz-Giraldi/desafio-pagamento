import { Badge } from '@/components/ui'
import type { OrderStatus } from '@/types/order'
import type { TransactionStatus } from '@/types/transaction'

type StatusType = OrderStatus | TransactionStatus

const statusConfig: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  PROCESSING: { label: 'Processando', variant: 'info' },
  PAID: { label: 'Pago', variant: 'success' },
  APPROVED: { label: 'Aprovado', variant: 'success' },
  DECLINED: { label: 'Recusado', variant: 'danger' },
  SUSPECTED_FRAUD: { label: 'Fraude Suspeita', variant: 'danger' },
  CANCELLED: { label: 'Cancelado', variant: 'neutral' },
  REFUNDED: { label: 'Reembolsado', variant: 'info' },
  PARTIALLY_REFUNDED: { label: 'Reemb. Parcial', variant: 'info' },
  FULLY_REFUNDED: { label: 'Reembolsado', variant: 'info' },
}

interface StatusBadgeProps {
  status: StatusType
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'neutral' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
