import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TwoFactorPage } from './two-factor-page'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/auth.api', () => ({
  authApi: {
    verifyTwoFactor: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

function renderTwoFactor() {
  return render(
    <MemoryRouter initialEntries={['/2fa-verify']}>
      <Routes>
        <Route path="/2fa-verify" element={<TwoFactorPage />} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TwoFactorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clear()
  })

  it('redirects to login without temporary token', async () => {
    renderTwoFactor()

    expect(await screen.findByText('Login')).toBeInTheDocument()
  })

  it('validates code before submitting', async () => {
    useAuthStore.getState().setTwoFactorToken('tmp-token')
    renderTwoFactor()

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(await screen.findByText('Codigo obrigatorio')).toBeInTheDocument()
    expect(mockedAuthApi.verifyTwoFactor).not.toHaveBeenCalled()
  })

  it('stores final token and navigates to dashboard', async () => {
    useAuthStore.getState().setTwoFactorToken('tmp-token')
    mockedAuthApi.verifyTwoFactor.mockResolvedValueOnce({ accessToken: 'jwt', requiresTwoFactor: false })
    renderTwoFactor()

    await userEvent.type(screen.getByLabelText('Codigo TOTP'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(mockedAuthApi.verifyTwoFactor).toHaveBeenCalledWith({
      twoFactorToken: 'tmp-token',
      totpCode: '123456',
    })
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('jwt')
    expect(useAuthStore.getState().twoFactorToken).toBeNull()
  })

  it('shows verification errors', async () => {
    useAuthStore.getState().setTwoFactorToken('tmp-token')
    mockedAuthApi.verifyTwoFactor.mockRejectedValueOnce(new Error('Codigo invalido'))
    renderTwoFactor()

    await userEvent.type(screen.getByLabelText('Codigo TOTP'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Codigo invalido'))
  })
})
