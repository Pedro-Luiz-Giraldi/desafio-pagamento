import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionDetailPage } from './transaction-detail-page'

vi.mock('@/hooks/use-transactions', () => ({
  useTransaction: vi.fn(),
  useRefundTransaction: vi.fn(),
}))

import { useTransaction, useRefundTransaction } from '@/hooks/use-transactions'

const mockedUseTransaction = vi.mocked(useTransaction)
const mockedUseRefund = vi.mocked(useRefundTransaction)

const mockTxn = {
  data: {
    transactionId: 'txn-1',
    status: 'APPROVED' as const,
    amountInCents: 3000,
    currency: 'BRL',
    cardBrand: 'Mastercard',
    cardLastFour: '5678',
    installments: 3,
    orderId: 'ord-1',
    processingTimeMs: 200,
    createdAt: '2026-06-22T00:00:00Z',
    updatedAt: '2026-06-22T00:00:00Z',
    refunds: [],
  },
}

function renderPage(id = 'txn-1') {
  return render(
    <MemoryRouter initialEntries={[`/transactions/${id}`]}>
      <Routes>
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
        <Route path="/transactions" element={<div>Lista</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseRefund.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as any)
  })

  it('shows loading state', () => {
    mockedUseTransaction.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
    renderPage()
    expect(screen.queryByText('Detalhe da Transação')).not.toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseTransaction.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any)
    renderPage()
    expect(screen.getByText('Erro ao carregar transação')).toBeInTheDocument()
  })

  it('renders transaction details', () => {
    mockedUseTransaction.mockReturnValue({ data: mockTxn, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText(/Transação #txn-1/)).toBeInTheDocument()
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument()
    expect(screen.getByText('Mastercard')).toBeInTheDocument()
    expect(screen.getByText('****5678')).toBeInTheDocument()
    expect(screen.getByText('3x')).toBeInTheDocument()
  })

  it('shows refund button for APPROVED transactions', () => {
    mockedUseTransaction.mockReturnValue({ data: mockTxn, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.getByText('Estornar')).toBeInTheDocument()
  })

  it('hides refund button for non-APPROVED transactions', () => {
    mockedUseTransaction.mockReturnValue({ data: { data: { ...mockTxn.data, status: 'DECLINED' } }, isLoading: false, isError: false } as any)
    renderPage()
    expect(screen.queryByText('Estornar')).not.toBeInTheDocument()
  })
})
