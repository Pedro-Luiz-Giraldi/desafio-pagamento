export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const IDEMPOTENT_PATHS = [
  '/api/v1/orders',
  '/api/v1/transactions',
] as const

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CONFIRM_EMAIL: '/confirm-email',
  RESEND_CONFIRMATION: '/resend-confirmation',
  TWO_FACTOR_VERIFY: '/2fa/verify',
  TWO_FACTOR_RECOVERY: '/2fa/recovery',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_2FA: '/profile/2fa',
  ORDERS: '/orders',
  NEW_ORDER: '/orders/new',
  ORDER_DETAIL: '/orders/:id',
  PAYMENT: '/orders/:id/pay',
  TRANSACTIONS: '/transactions',
  TRANSACTION_DETAIL: '/transactions/:id',
  REFUND: '/transactions/:id/refund',
} as const

export const ERROR_MESSAGES: Record<string, string> = {
  CARD_DECLINED: 'Cartão recusado. Verifique os dados ou tente outro cartão.',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente no cartão.',
  FRAUD_DETECTED: 'Transação não autorizada. Entre em contato com o suporte.',
  INVALID_CARD: 'Dados do cartão inválidos.',
  CARD_EXPIRED: 'Cartão expirado.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  RATE_LIMIT: 'Muitas tentativas. Aguarde alguns segundos.',
  TIMEOUT: 'A requisição demorou muito. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente em instantes.',
}

export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] ?? 'Ocorreu um erro inesperado.'
}
