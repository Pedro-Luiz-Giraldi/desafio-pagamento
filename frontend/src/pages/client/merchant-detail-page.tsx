import { useParams, Link } from 'react-router-dom'
import { useMerchant } from '@/hooks/use-merchants'

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: merchant, isLoading, error } = useMerchant(id!)

  if (isLoading) return <div className="p-6"><p className="text-gray-500">Carregando...</p></div>

  if (error || !merchant) {
    return (
      <div className="p-6">
        <p className="text-red-500">Loja nao encontrada.</p>
        <Link to="/merchants" className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
          &larr; Voltar para lojas
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Link to="/merchants" className="text-sm text-indigo-600 hover:text-indigo-800">
        &larr; Voltar para lojas
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">{merchant.companyName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Loja desde {new Date(merchant.createdAt).toLocaleDateString('pt-BR')}
        </p>

        <Link
          to={`/orders/new?merchantId=${merchant.id}`}
          className="inline-flex items-center mt-6 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Criar Pedido
        </Link>
      </div>
    </div>
  )
}
