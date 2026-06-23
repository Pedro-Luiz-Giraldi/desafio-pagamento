import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthenticatedLayout } from './authenticated-layout'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'

vi.mock('@/api/auth.api', () => ({
  authApi: {
    logout: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
    useAuthStore.getState().setUser({
      userId: '123',
      email: 'merchant@test.com',
      fullName: 'Test Merchant',
      role: 'MERCHANT',
      twoFactorEnabled: false,
      emailConfirmed: true,
      createdAt: '2024-01-01T00:00:00Z',
    })
    vi.clearAllMocks()
  })

  it('renders sidebar with navigation items', () => {
    render(
      <BrowserRouter>
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('Acabou o Mony')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText('Pedidos')).toBeInTheDocument()
    expect(screen.getByText('Transações')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('renders topbar with user info', () => {
    render(
      <BrowserRouter>
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('Test Merchant')).toBeInTheDocument()
    expect(screen.getByText('merchant@test.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <BrowserRouter>
        <AuthenticatedLayout>
          <div>Test Content</div>
        </AuthenticatedLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('handles logout successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.logout).mockResolvedValue()

    render(
      <BrowserRouter>
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      </BrowserRouter>
    )

    const logoutButton = screen.getByRole('button', { name: /sair/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledOnce()
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('clears auth state even if logout API fails', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      </BrowserRouter>
    )

    const logoutButton = screen.getByRole('button', { name: /sair/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
