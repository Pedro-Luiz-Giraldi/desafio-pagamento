import { useEffect, useRef, useState } from 'react'

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string

export interface CardTokenData {
  cardNumber: string
  cardholderName: string
  cardExpirationMonth: string
  cardExpirationYear: string
  securityCode: string
}

export function useMercadoPago() {
  const mpRef = useRef<InstanceType<Window['MercadoPago']> | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    function init() {
      if (!window.MercadoPago) return
      if (!mpRef.current) {
        mpRef.current = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })
      }
      setIsReady(true)
    }

    if (window.MercadoPago) {
      init()
    } else {
      const script = document.querySelector('script[src*="sdk.mercadopago.com"]')
      if (script) {
        script.addEventListener('load', init, { once: true })
      }
    }
  }, [])

  async function createCardToken(
    data: CardTokenData
  ): Promise<{ token: string } | { error: string }> {
    if (!mpRef.current) return { error: 'SDK não carregado' }
    try {
      const result = await mpRef.current.createCardToken({
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        cardExpirationMonth: data.cardExpirationMonth,
        cardExpirationYear: data.cardExpirationYear,
        securityCode: data.securityCode,
      })
      return { token: result.id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao tokenizar cartão'
      return { error: msg }
    }
  }

  return { createCardToken, isReady }
}
