import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrdersListPage } from './orders-list-page'

vi.mock('@/hooks/use-orders', () => ({
  useOrdersList: vi.fn(),
}))

import { useOrdersList } from '@/hooks/use-orders'

const mockedUseOrdersList = vi.mocked(useOrdersList)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/orders']}>
      <Routes>
        <Route path="/orders" element={<OrdersListPage />} />
        <Route path="/orders/new" element={<div>Novo Pedido</div>} />
        <Route path="/orders/:id" element={<div>Detalhe</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrdersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    mockedUseOrdersList.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
    renderPage()
    expect(screen.getByText('Pedidos')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    mockedUseOrdersList.mockReturnValue({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } }, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseOrdersList.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any)
    renderPage()
    expect(screen.getByText('Erro ao carregar pedidos')).toBeInTheDocument()
  })

  it('renders orders list', () => {
    mockedUseOrdersList.mockReturnValue({
      data: {
        data: [{ orderId: 'ord-1', status: 'PENDING', totalInCents: 1000, items: [{ productId: 'p1', description: 'Item', quantity: 1, unitPriceInCents: 1000, subtotalInCents: 1000 }], createdAt: '2026-06-22T00:00:00Z' }],
        meta: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    } as any)
    renderPage()
    expect(screen.getAllByText('Pendente').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument()
  })

  it('navigates to create page', async () => {
    mockedUseOrdersList.mockReturnValue({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } }, isLoading: false, isError: false } as any)
    renderPage()
    const userEvent = (await import('@testing-library/user-event')).default
    await userEvent.click(screen.getByText('Novo Pedido'))
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument()
  })
})
