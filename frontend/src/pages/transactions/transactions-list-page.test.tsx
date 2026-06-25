import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionsListPage } from './transactions-list-page'

vi.mock('@/hooks/use-transactions', () => ({
  useTransactionsList: vi.fn(),
}))

import { useTransactionsList } from '@/hooks/use-transactions'

const mockedUseList = vi.mocked(useTransactionsList)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/transactions']}>
      <Routes>
        <Route path="/transactions" element={<TransactionsListPage />} />
        <Route path="/transactions/:id" element={<div>Detalhe</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TransactionsListPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows loading state', () => {
    mockedUseList.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
    renderPage()
    expect(screen.getByText('Transações')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    mockedUseList.mockReturnValue({ data: { data: [], meta: { page: 0, size: 20, totalElements: 0, totalPages: 0 } }, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseList.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any)
    renderPage()
    expect(screen.getByText('Erro ao carregar transações')).toBeInTheDocument()
  })

  it('renders transactions list', () => {
    mockedUseList.mockReturnValue({
      data: {
        data: [{ transactionId: 'txn-1', status: 'APPROVED', amountInCents: 2000, currency: 'BRL', cardBrand: 'Visa', cardLastFour: '1234', orderId: 'ord-1', processingTimeMs: 150, createdAt: '2026-06-22T00:00:00Z' }],
        meta: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    } as any)
    renderPage()
    expect(screen.getByRole('cell', { name: 'Aprovado' })).toBeInTheDocument()
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument()
    expect(screen.getByText('Visa ****1234')).toBeInTheDocument()
  })
})
