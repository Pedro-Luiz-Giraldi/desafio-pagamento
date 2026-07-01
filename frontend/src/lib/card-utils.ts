/**
 * Detects card brand from card number
 * Returns Mercado Pago payment method IDs
 */
export function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  // Visa: starts with 4
  if (/^4/.test(cleaned)) {
    return 'visa'
  }
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2(22[1-9]|2[3-9]|[3-6]|7[0-1]|720)/.test(cleaned)) {
    return 'master'
  }
  
  // Amex: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) {
    return 'amex'
  }
  
  // Elo: starts with specific BINs
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/.test(cleaned)) {
    return 'elo'
  }
  
  // Hipercard: starts with 606282 or 3841
  if (/^(606282|3841)/.test(cleaned)) {
    return 'hipercard'
  }
  
  // Default to visa if unknown (Mercado Pago will validate)
  return 'visa'
}

/**
 * Formats card number with spaces
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '')
  const chunks = cleaned.match(/.{1,4}/g) || []
  return chunks.join(' ')
}

/**
 * Gets card brand display name
 */
export function getCardBrandName(paymentMethodId: string): string {
  const names: Record<string, string> = {
    visa: 'Visa',
    master: 'Mastercard',
    amex: 'American Express',
    elo: 'Elo',
    hipercard: 'Hipercard',
  }
  return names[paymentMethodId] || 'Cartão'
}
