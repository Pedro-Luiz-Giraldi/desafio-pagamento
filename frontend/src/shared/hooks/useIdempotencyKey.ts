import { useCallback, useState } from 'react'

export function useIdempotencyKey() {
  const [key, setKey] = useState(() => crypto.randomUUID())
  const reset = useCallback(() => setKey(crypto.randomUUID()), [])
  return { key, reset }
}
