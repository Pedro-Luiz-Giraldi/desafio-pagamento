import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMerchants } from '@/hooks/use-merchants'
import { useProducts } from '@/hooks/use-products'
import { useCreateOrder } from '@/hooks/use-orders'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Spinner } from '@/components/ui'
import { toast } from '@/lib/toast-store'
import { formatCents } from '@/lib/utils'
import type { Product } from '@/api/products.api'

interface CartItem extends Product {
  quantity: number
}

type Step = 'merchant' | 'products' | 'review'

export function OrderCreatePage() {
  const navigate = useNavigate()
  const { data: merchants, isLoading: merchantsLoading, isError: merchantsError } = useMerchants()
  const [step, setStep] = useState<Step>('merchant')
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null)
  const { data: products, isLoading: productsLoading } = useProducts(selectedMerchantId)
  const [cart, setCart] = useState<CartItem[]>([])
  const createOrder = useCreateOrder()

  const selectedMerchant = merchants?.find((m) => m.id === selectedMerchantId)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    )
  }

  async function handleSubmit() {
    if (!selectedMerchantId || cart.length === 0) return
    try {
      const result = await createOrder.mutateAsync({
        merchantId: selectedMerchantId,
        items: cart.map((item) => ({
          productId: item.id,
          description: item.name,
          quantity: item.quantity,
          unitPriceInCents: item.priceInCents,
        })),
      })
      toast.success('Pedido criado com sucesso')
      navigate(`/orders/${result.data.orderId}`)
    } catch {
      toast.error('Erro ao criar pedido')
    }
  }

  const totalInCents = cart.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0)

  if (step === 'merchant') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Novo Pedido</h2>
          <Button variant="secondary" onClick={() => navigate('/orders')}>Cancelar</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Selecione um Lojista</CardTitle></CardHeader>
          <CardContent>
            {merchantsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : merchantsError ? (
              <p className="text-sm text-red-600">Erro ao carregar lojistas</p>
            ) : !merchants?.length ? (
              <p className="text-sm text-gray-500">Nenhum lojista disponivel</p>
            ) : (
              <div className="space-y-2">
                {merchants.map((merchant) => (
                  <button
                    key={merchant.id}
                    onClick={() => { setSelectedMerchantId(merchant.id); setStep('products') }}
                    className="w-full text-left rounded-lg border border-gray-200 p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{merchant.companyName}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {merchant.id.slice(0, 8)}...</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'products') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedMerchant?.companyName}</h2>
            <p className="text-sm text-gray-500 mt-1">Selecione os produtos</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/orders')}>Cancelar</Button>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep('merchant')}>&larr; Voltar</Button>
        </div>

        {cart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCents(item.priceInCents)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Button onClick={() => setStep('review')} disabled={cart.length === 0}>
                  Revisar Pedido ({formatCents(totalInCents)})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Produtos</CardTitle></CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !products?.length ? (
              <p className="text-sm text-gray-500">Nenhum produto disponivel</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => {
                  const inCart = cart.find((item) => item.id === product.id)
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                        )}
                        <p className="text-sm font-semibold text-emerald-700 mt-1">
                          {formatCents(product.priceInCents)}
                        </p>
                      </div>
                      <Button
                        variant={inCart ? 'secondary' : 'primary'}
                        onClick={() => addToCart(product)}
                      >
                        {inCart ? `Adicionado (${inCart.quantity})` : 'Adicionar'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revisar Pedido</h2>
          <p className="text-sm text-gray-500 mt-1">{selectedMerchant?.companyName}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/orders')}>Cancelar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 font-medium">Qtd</th>
                <th className="pb-2 font-medium">Preco</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 text-gray-900">{item.name}</td>
                  <td className="py-2 text-gray-600">{item.quantity}</td>
                  <td className="py-2 text-gray-600">{formatCents(item.priceInCents)}</td>
                  <td className="py-2 text-right font-medium">{formatCents(item.priceInCents * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-right text-lg font-semibold text-gray-900">
            Total: {formatCents(totalInCents)}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep('products')}>&larr; Voltar</Button>
        <Button onClick={handleSubmit} disabled={createOrder.isPending}>
          {createOrder.isPending ? <Spinner label="Criando" /> : 'Confirmar Pedido'}
        </Button>
      </div>
    </div>
  )
}
