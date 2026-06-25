export type TransactionStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'SUSPECTED_FRAUD'
  | 'FULLY_REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'PROCESSING'
  | 'CANCELLED'

export interface Transaction {
  transactionId: string
  mpPaymentId?: number
  orderId: string
  status: TransactionStatus
  amountInCents: number
  currency: string
  cardBrand?: string
  cardLastFour?: string
  installments?: number
  processingTimeMs: number
  createdAt: string
}

export interface TransactionDetail extends Transaction {
  updatedAt: string
  refunds: RefundSummary[]
}

export interface RefundSummary {
  refundId: string
  amountInCents: number
  reason: string
  status: string
  createdAt: string
}

export type RefundReason = 'CUSTOMER_REQUEST' | 'DUPLICATE' | 'FRAUD' | 'PRODUCT_NOT_DELIVERED'

export interface RefundRequest {
  amountInCents: number
  reason: RefundReason
  requestedBy: string
}
