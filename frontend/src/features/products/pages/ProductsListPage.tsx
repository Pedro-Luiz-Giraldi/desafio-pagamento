import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, PackageX, Link2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { productService } from '@features/products/services/productService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES } from '@lib/constants'
import type { Product } from '@lib/types/products.types'

const schema = z.object({
  name: z.string().min(1, 'Informe o nome').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(255, 'Máximo 255 caracteres'),
  price: z
    .string()
    .min(1, 'Informe o preço')
    .refine(v => parseFloat(v.replace(',', '.')) >= 0.01, 'Preço mínimo: R$ 0,01'),
})

type FormData = z.infer<typeof schema>

export default function ProductsListPage() {
  const { user } = useAuth()
  const merchantId = user?.merchantId ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (merchantId) setProducts(productService.getProducts(merchantId))
  }, [merchantId])

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', price: '' })
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setValue('name', product.name)
    setValue('description', product.description)
    setValue('price', (product.priceInCents / 100).toFixed(2).replace('.', ','))
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
  }

  function onSubmit(data: FormData) {
    const priceInCents = Math.round(parseFloat(data.price.replace(',', '.')) * 100)
    if (editing) {
      productService.updateProduct(merchantId, editing.id, {
        name: data.name,
        description: data.description,
        priceInCents,
      })
    } else {
      productService.createProduct(merchantId, {
        name: data.name,
        description: data.description,
        priceInCents,
      })
    }
    setProducts(productService.getProducts(merchantId))
    closeModal()
  }

  function handleToggleActive(product: Product) {
    productService.updateProduct(merchantId, product.id, { active: !product.active })
    setProducts(productService.getProducts(merchantId))
  }

  function handleDelete(product: Product) {
    if (!confirm(`Remover "${product.name}"?`)) return
    productService.deleteProduct(merchantId, product.id)
    setProducts(productService.getProducts(merchantId))
  }

  function copyCheckoutLink(product: Product) {
    const path = ROUTES.CHECKOUT
      .replace(':merchantId', merchantId)
      .replace(':productId', product.id)
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({
      name: product.name,
      description: product.description,
      priceInCents: product.priceInCents,
    }))))
    const url = `${window.location.origin}${path}?d=${encoded}`
    navigator.clipboard.writeText(url)
    setCopiedProductId(product.id)
    setTimeout(() => setCopiedProductId(null), 2000)
  }

  if (!merchantId) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Conta de lojista não configurada.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus Produtos</h1>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <PackageX className="h-10 w-10 opacity-40" />
          <p className="text-sm">Nenhum produto cadastrado ainda.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>Criar primeiro produto</Button>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {products.map(product => (
            <div key={product.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    product.active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{product.description}</p>
                )}
              </div>
              <p className="text-sm font-semibold text-right flex-none w-24">
                {formatCurrency(product.priceInCents)}
              </p>
              <div className="flex items-center gap-1 flex-none">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs gap-1.5 ${copiedProductId === product.id ? 'text-green-600' : 'text-muted-foreground'}`}
                  onClick={() => copyCheckoutLink(product)}
                  title="Copiar link de checkout"
                >
                  {copiedProductId === product.id
                    ? <><Check className="h-3.5 w-3.5" />Copiado!</>
                    : <><Link2 className="h-3.5 w-3.5" />Link</>
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={() => handleToggleActive(product)}
                >
                  {product.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(product)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold">
              {editing ? 'Editar produto' : 'Novo produto'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do produto</Label>
                <Input id="name" placeholder="Ex: Blusa tamanho M — cor azul" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="description" placeholder="Detalhes adicionais do produto" {...register('description')} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="text" inputMode="decimal" placeholder="0,00" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {editing ? 'Salvar' : 'Criar produto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
