import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './dashboard-page'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/hooks/use-orders', () => ({
  useOrdersList: vi.fn(),
}))

vi.mock('@/hooks/use-transactions', () => ({
  useTransactionsList: vi.fn(),
}))

import { useOrdersList } from '@/hooks/use-orders'
import { useTransactionsList } from '@/hooks/use-transactions'

const mockedUseOrdersList = vi.mocked(useOrdersList)
const mockedUseTransactionsList = vi.mocked(useTransactionsList)

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clear()
    mockedUseOrdersList.mockReturnValue({ data: { data: [], meta: { page: 0, size: 5, totalElements: 0, totalPages: 0 } }, isLoading: false } as any)
    mockedUseTransactionsList.mockReturnValue({ data: { data: [], meta: { page: 0, size: 5, totalElements: 0, totalPages: 0 } }, isLoading: false } as any)
  })

  it('renders welcome message with user name', () => {
    useAuthStore.getState().setUser({
      userId: '123', email: 'm@m.com', fullName: 'João Silva', role: 'MERCHANT',
      twoFactorEnabled: false, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
    renderDashboard()
    expect(screen.getByText(/Bem-vindo, João Silva!/i)).toBeInTheDocument()
  })

  it('renders default name when user is not loaded', () => {
    renderDashboard()
    expect(screen.getByText(/Bem-vindo, Merchant!/i)).toBeInTheDocument()
  })

  it('shows pending orders count', () => {
    renderDashboard()
    expect(screen.getByText('📦 Pedidos Pendentes')).toBeInTheDocument()
  })

  it('shows quick action buttons', () => {
    renderDashboard()
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument()
    expect(screen.getByText('Ver Transações')).toBeInTheDocument()
  })

  it('shows empty state for orders', () => {
    renderDashboard()
    expect(screen.getByText('Nenhum pedido pendente')).toBeInTheDocument()
  })

  it('shows empty state for transactions', () => {
    renderDashboard()
    expect(screen.getByText('Nenhuma transação recente')).toBeInTheDocument()
  })

  it('renders recent orders', () => {
    mockedUseOrdersList.mockReturnValue({
      data: {
        data: [{ orderId: 'ord-1', status: 'PENDING', totalInCents: 1000, items: [{ productId: 'p1', description: 'Item', quantity: 1, unitPriceInCents: 1000, subtotalInCents: 1000 }], createdAt: '2026-06-22T00:00:00Z' }],
        meta: { page: 0, size: 5, totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
    } as any)
    renderDashboard()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('renders recent transactions', () => {
    mockedUseTransactionsList.mockReturnValue({
      data: {
        data: [{ transactionId: 'txn-1', status: 'APPROVED', amountInCents: 2000, currency: 'BRL', cardBrand: 'Visa', cardLastFour: '1234', orderId: 'ord-1', processingTimeMs: 150, createdAt: '2026-06-22T00:00:00Z' }],
        meta: { page: 0, size: 5, totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
    } as any)
    renderDashboard()
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })
})
