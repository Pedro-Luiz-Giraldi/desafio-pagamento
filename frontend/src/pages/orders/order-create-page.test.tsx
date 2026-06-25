import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderCreatePage } from './order-create-page'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/hooks/use-orders', () => ({
  useCreateOrder: vi.fn(),
}))

import { useCreateOrder } from '@/hooks/use-orders'

const mockedCreateOrder = vi.mocked(useCreateOrder)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/orders/new']}>
      <Routes>
        <Route path="/orders/new" element={<OrderCreatePage />} />
        <Route path="/orders/:id" element={<div>Detalhe do Pedido</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrderCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setUser({
      userId: 'm-1', email: 'm@m.com', fullName: 'Merchant', role: 'MERCHANT',
      twoFactorEnabled: false, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
  })

  it('renders form with empty items', () => {
    mockedCreateOrder.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as any)
    renderPage()
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
  })

  it('adds and removes items', async () => {
    mockedCreateOrder.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as any)
    renderPage()
    await userEvent.click(screen.getByText('+ Adicionar Item'))
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    const removeButtons = screen.getAllByText('Remover')
    await userEvent.click(removeButtons[0])
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument()
  })

  it('submits form and navigates on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ data: { orderId: 'ord-1' } })
    mockedCreateOrder.mockReturnValue({ isPending: false, mutateAsync } as any)
    renderPage()
    await userEvent.type(screen.getByLabelText('Produto ID'), 'p-1')
    await userEvent.type(screen.getByLabelText('Descrição'), 'Item Teste')
    const priceInput = screen.getByLabelText('Preço Unitário (centavos)')
    await userEvent.clear(priceInput)
    await userEvent.type(priceInput, '1000')
    await userEvent.click(screen.getByRole('button', { name: 'Criar Pedido' }))
    await waitFor(() => expect(screen.getByText('Detalhe do Pedido')).toBeInTheDocument())
  })
})
