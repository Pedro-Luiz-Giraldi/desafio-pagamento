import { Link } from 'react-router-dom'
import { useMerchants } from '@/hooks/use-merchants'

export function MerchantsListPage() {
  const { data: merchants, isLoading, error } = useMerchants()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lojas</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione uma loja para ver seus produtos e fazer um pedido</p>
      </div>

      {isLoading && <p className="text-gray-500">Carregando lojas...</p>}

      {error && (
        <p className="text-red-500">Erro ao carregar lojas. Tente novamente.</p>
      )}

      {merchants && merchants.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">Nenhuma loja disponivel no momento.</p>
        </div>
      )}

      {merchants && merchants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchants.map((merchant) => (
            <div
              key={merchant.id}
              className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900">{merchant.companyName}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Desde {new Date(merchant.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/merchants/${merchant.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Ver detalhes
                </Link>
                <Link
                  to={`/orders/new?merchantId=${merchant.id}`}
                  className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Criar Pedido
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
