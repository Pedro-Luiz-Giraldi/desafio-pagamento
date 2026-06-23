export type TransactionStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'SUSPECTED_FRAUD'
  | 'PROCESSING'
  | 'FULLY_REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type RefundReason =
  | 'CUSTOMER_REQUEST'
  | 'DUPLICATE'
  | 'FRAUD'
  | 'PRODUCT_NOT_DELIVERED'

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Transaction {
  id: string
  orderId: string
  customerId: string
  amountInCents: number
  currency: string
  status: TransactionStatus
  errorCode?: string
  processingTimeMs: number
  createdAt: string
  updatedAt: string
}

export interface RefundEntry {
  refundId: string
  amountInCents: number
  reason: RefundReason
  status: RefundStatus
  createdAt: string
}

export interface TransactionDetail extends Transaction {
  totalRefundedInCents: number
  availableForRefundInCents: number
  cardLastFour: string
  cardBrand: string
  refunds: RefundEntry[]
}

export interface Refund {
  id: string
  transactionId: string
  amountInCents: number
  reason: RefundReason
  status: RefundStatus
  createdAt: string
}

export interface CreateTransactionRequest {
  orderId: string
  cardToken: string
  amountInCents: number
  installments?: number
}

export interface CreateRefundRequest {
  amountInCents: number
  reason: RefundReason
}

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  CUSTOMER_REQUEST: 'Solicitação do cliente',
  DUPLICATE: 'Pagamento duplicado',
  FRAUD: 'Fraude',
  PRODUCT_NOT_DELIVERED: 'Produto não entregue',
}
