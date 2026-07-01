import { useAuthStore } from '@/stores/auth.store'
import { useProducts } from '@/hooks/use-products'

export function ProductsPage() {
  const user = useAuthStore((state) => state.user)
  const merchantId = user?.merchantId

  const { data: products, isLoading, error } = useProducts(merchantId ?? null)

  if (!merchantId) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Merchant profile not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
        <p className="text-sm text-gray-500 mt-1">Lista de produtos do seu catalogo</p>
      </div>

      {isLoading && <p className="text-gray-500">Carregando produtos...</p>}

      {error && (
        <p className="text-red-500">Erro ao carregar produtos. Tente novamente.</p>
      )}

      {products && products.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
          <p className="text-sm text-gray-400 mt-1">Os produtos sao inseridos manualmente via banco de dados.</p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descricao</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Preco</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.description || '-'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    R$ {(product.priceInCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.active ? 'Sim' : 'Nao'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
