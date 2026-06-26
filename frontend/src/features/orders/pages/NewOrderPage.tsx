import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ArrowLeft, ShoppingCart, Store } from 'lucide-react'
import { ordersService } from '@features/orders/services/ordersService'
import { productService } from '@features/products/services/productService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES } from '@lib/constants'
import type { Product } from '@lib/types/products.types'

interface CartItem {
  product: Product
  quantity: number
}

export default function NewOrderPage() {
  const navigate = useNavigate()

  const [merchantIdInput, setMerchantIdInput] = useState('')
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [merchantError, setMerchantError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  function handleLoadCatalog() {
    setMerchantError(null)
    if (!UUID_REGEX.test(merchantIdInput.trim())) {
      setMerchantError('ID inválido — deve ser um UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)')
      return
    }
    const id = merchantIdInput.trim()
    const items = productService.getActiveProducts(id)
    if (items.length === 0) {
      setMerchantError('Nenhum produto encontrado para este lojista. Confirme o ID ou peça ao lojista para cadastrar produtos.')
      return
    }
    setMerchantId(id)
    setProducts(items)
    setCart([])
  }

  function changeQty(product: Product, delta: number) {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (!existing) {
        return delta > 0 ? [...prev, { product, quantity: 1 }] : prev
      }
      const newQty = existing.quantity + delta
      if (newQty <= 0) return prev.filter(c => c.product.id !== product.id)
      return prev.map(c => c.product.id === product.id ? { ...c, quantity: newQty } : c)
    })
  }

  function getQty(productId: string): number {
    return cart.find(c => c.product.id === productId)?.quantity ?? 0
  }

  const totalInCents = cart.reduce((sum, c) => sum + c.product.priceInCents * c.quantity, 0)
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)

  async function handleSubmit() {
    if (!merchantId || cart.length === 0) return
    setSubmitting(true)
    setServerError(null)

    const result = await ordersService.createOrder({
      merchantId,
      items: cart.map(c => ({
        product: c.product,
        quantity: c.quantity,
      })),
    })

    setSubmitting(false)
    if (!result.ok) {
      setServerError('Não foi possível criar o pedido. Tente novamente.')
      return
    }
    navigate(ROUTES.ORDER_DETAIL.replace(':id', result.data.id))
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nova Compra</h1>
          <p className="text-sm text-muted-foreground">Informe o ID do lojista para ver o catálogo.</p>
        </div>
      </div>

      {/* Step 1 — merchant ID input */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Store className="h-4 w-4 text-primary" />
          Lojista
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="merchantId">ID do Lojista</Label>
            <Input
              id="merchantId"
              value={merchantIdInput}
              onChange={e => { setMerchantIdInput(e.target.value); setMerchantError(null) }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={!!merchantId}
            />
            {merchantError && <p className="text-xs text-destructive">{merchantError}</p>}
          </div>
          {merchantId ? (
            <div className="flex flex-col justify-end">
              <Button
                variant="outline"
                onClick={() => { setMerchantId(null); setProducts([]); setCart([]) }}
              >
                Trocar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col justify-end">
              <Button onClick={handleLoadCatalog}>Ver catálogo</Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2 — product catalog */}
      {merchantId && products.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Catálogo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(product => {
              const qty = getQty(product.id)
              return (
                <div
                  key={product.id}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    qty > 0 ? 'border-primary/40 bg-primary/5' : 'bg-white'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold">{formatCurrency(product.priceInCents)}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={qty === 0}
                        onClick={() => changeQty(product, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changeQty(product, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 3 — cart summary + checkout */}
      {cart.length > 0 && (
        <div className="rounded-lg border bg-white p-5 space-y-4 sticky bottom-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Resumo do pedido
          </div>

          <div className="space-y-1.5">
            {cart.map(c => (
              <div key={c.product.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {c.quantity}× {c.product.name}
                </span>
                <span className="font-medium">{formatCurrency(c.product.priceInCents * c.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
              <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
              <span className="text-lg">{formatCurrency(totalInCents)}</span>
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-destructive">{serverError}</p>
          )}

          <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Criando pedido...' : 'Fazer Pedido'}
          </Button>
        </div>
      )}
    </div>
  )
}
