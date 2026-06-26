import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateOrder } from '@/hooks/use-orders'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '@/components/ui'
import { toast } from '@/lib/toast-store'
import { useAuthStore } from '@/stores/auth.store'

interface OrderItemForm {
  productId: string
  description: string
  quantity: number
  unitPriceInCents: number
}

export function OrderCreatePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createOrder = useCreateOrder()
  const [items, setItems] = useState<OrderItemForm[]>([{ productId: '', description: '', quantity: 1, unitPriceInCents: 0 }])

  function addItem() {
    setItems([...items, { productId: '', description: '', quantity: 1, unitPriceInCents: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof OrderItemForm, value: string | number) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(updated)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    console.log('[OrderCreatePage] User from store:', user)
    
    if (!user) {
      console.error('[OrderCreatePage] User is null')
      toast.error('Usuário não carregado. Faça login novamente.')
      return
    }

    if (!user.merchantId) {
      console.error('[OrderCreatePage] merchantId is missing:', user)
      toast.error('Merchant ID não encontrado. Entre em contato com o suporte.')
      return
    }

    const validItems = items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPriceInCents: Number(item.unitPriceInCents),
    }))

    const totalInCents = validItems.reduce((sum, item) => sum + item.quantity * item.unitPriceInCents, 0)
    if (totalInCents <= 0) {
      toast.error('Adicione pelo menos um item com valor válido')
      return
    }

    try {
      const result = await createOrder.mutateAsync({ merchantId: user.merchantId, items: validItems })
      toast.success('Pedido criado com sucesso')
      navigate(`/orders/${result.data.orderId}`)
    } catch {
      toast.error('Erro ao criar pedido')
    }
  }

  const total = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPriceInCents), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Novo Pedido</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <form aria-label="Formulario de pedido" className="space-y-4" onSubmit={handleSubmit}>
            {items.map((item, index) => (
              <div key={index} className="space-y-3 rounded-md border border-gray-200 p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button variant="ghost" onClick={() => removeItem(index)} type="button" className="text-sm">
                      Remover
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Produto ID" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} />
                  <Input label="Descrição" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                  <Input label="Quantidade" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} />
                  <Input label="Preço Unitário (centavos)" type="number" min={0} value={item.unitPriceInCents} onChange={(e) => updateItem(index, 'unitPriceInCents', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            ))}

            <Button variant="secondary" onClick={addItem} type="button" className="w-full sm:w-auto">
              + Adicionar Item
            </Button>

            <div className="text-right text-lg font-semibold text-gray-900">
              Total: {(total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => navigate('/orders')} type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={createOrder.isPending} className="w-full sm:w-auto">
                {createOrder.isPending ? <Spinner label="Criando" /> : 'Criar Pedido'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
