export function formatCurrency(amountInCents: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}
