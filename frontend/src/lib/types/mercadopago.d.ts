interface MercadoPagoCardData {
  cardNumber: string
  cardholderName: string
  cardExpirationMonth: string
  cardExpirationYear: string
  securityCode: string
  identificationType?: string
  identificationNumber?: string
}

interface MercadoPagoInstance {
  createCardToken(data: MercadoPagoCardData): Promise<{ id: string; [key: string]: unknown }>
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance
  }
}

export {}
