import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderDetailPage } from './order-detail-page'

vi.mock('@/hooks/use-orders', () => ({
  useOrder: vi.fn(),
  useCancelOrder: vi.fn(),
}))

import { useOrder, useCancelOrder } from '@/hooks/use-orders'

const mockedUseOrder = vi.mocked(useOrder)
const mockedUseCancelOrder = vi.mocked(useCancelOrder)

const mockOrder = {
  data: {
    orderId: 'ord-1',
    status: 'PENDING' as const,
    totalInCents: 1500,
    items: [{ productId: 'p-1', description: 'Item 1', quantity: 2, unitPriceInCents: 750, subtotalInCents: 1500 }],
    customerId: 'cust-1',
    merchantId: 'm-1',
    createdAt: '2026-06-22T00:00:00Z',
    updatedAt: '2026-06-22T00:00:00Z',
  },
}

function renderPage(id = 'ord-1') {
  return render(
    <MemoryRouter initialEntries={[`/orders/${id}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders" element={<div>Lista de Pedidos</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseCancelOrder.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as any)
  })

  it('shows loading state', () => {
    mockedUseOrder.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
    const { container } = renderPage()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseOrder.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any)
    renderPage()
    expect(screen.getByText('Erro ao carregar pedido')).toBeInTheDocument()
  })

  it('renders order details', () => {
    mockedUseOrder.mockReturnValue({ data: mockOrder, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText(/Pedido #ord-1/)).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 15,00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
  })

  it('shows cancel button for PENDING orders', () => {
    mockedUseOrder.mockReturnValue({ data: mockOrder, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText('Cancelar Pedido')).toBeInTheDocument()
  })

  it('hides cancel button for non-PENDING orders', () => {
    mockedUseOrder.mockReturnValue({ data: { data: { ...mockOrder.data, status: 'PAID' } }, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.queryByText('Cancelar Pedido')).not.toBeInTheDocument()
  })
})
