import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from './dashboard-page'
import { useAuthStore } from '@/stores/auth.store'

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('renders welcome message with user name', () => {
    useAuthStore.getState().setUser({
      userId: '123',
      email: 'merchant@test.com',
      fullName: 'João Silva',
      role: 'MERCHANT',
      twoFactorEnabled: false,
      emailConfirmed: true,
      createdAt: '2024-01-01T00:00:00Z',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/Bem-vindo, João Silva!/i)).toBeInTheDocument()
  })

  it('renders default name when user is not loaded', () => {
    render(<DashboardPage />)

    expect(screen.getByText(/Bem-vindo, Merchant!/i)).toBeInTheDocument()
  })

  it('renders placeholder cards', () => {
    render(<DashboardPage />)

    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument()
    expect(screen.getByText('📦 Pedidos')).toBeInTheDocument()
    expect(screen.getByText('💳 Transações')).toBeInTheDocument()
  })

  it('renders construction notice', () => {
    render(<DashboardPage />)

    expect(screen.getByText('🚧 Em Construção')).toBeInTheDocument()
    expect(screen.getByText(/Este dashboard está sendo desenvolvido/i)).toBeInTheDocument()
  })

  it('lists upcoming features', () => {
    render(<DashboardPage />)

    expect(screen.getByText(/Visão geral de vendas e receitas/i)).toBeInTheDocument()
    expect(screen.getByText(/Pedidos recentes e status/i)).toBeInTheDocument()
    expect(screen.getByText(/Transações e histórico de pagamentos/i)).toBeInTheDocument()
    expect(screen.getByText(/Configurações de conta e 2FA/i)).toBeInTheDocument()
  })
})
