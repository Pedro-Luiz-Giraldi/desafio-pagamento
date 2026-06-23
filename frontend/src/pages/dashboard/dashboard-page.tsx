import { useAuthStore } from '@/stores/auth.store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.fullName || 'Merchant'}!
        </h2>
        <p className="text-gray-600 mt-1">
          Gerencie seus pagamentos e pedidos em um só lugar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>📊 Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Métricas e gráficos em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📦 Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Gestão de pedidos em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Histórico de transações em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚧 Em Construção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Este dashboard está sendo desenvolvido. Em breve você terá acesso a:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• Visão geral de vendas e receitas</li>
            <li>• Pedidos recentes e status</li>
            <li>• Transações e histórico de pagamentos</li>
            <li>• Configurações de conta e 2FA</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
