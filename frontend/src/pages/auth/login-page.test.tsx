import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './login-page'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/2fa-verify" element={<div>2FA</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clear()
  })

  it('validates required fields', async () => {
    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Email obrigatorio')).toBeInTheDocument()
    expect(screen.getByText('Senha obrigatoria')).toBeInTheDocument()
    expect(mockedAuthApi.login).not.toHaveBeenCalled()
  })

  it('stores token and navigates after complete login', async () => {
    mockedAuthApi.login.mockResolvedValueOnce({ accessToken: 'jwt', requiresTwoFactor: false })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('jwt')
  })

  it('stores temporary token and navigates to two-factor step', async () => {
    mockedAuthApi.login.mockResolvedValueOnce({ requiresTwoFactor: true, twoFactorToken: 'tmp-token' })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('2FA')).toBeInTheDocument()
    expect(useAuthStore.getState().twoFactorToken).toBe('tmp-token')
  })

  it('shows login errors', async () => {
    mockedAuthApi.login.mockRejectedValueOnce(new Error('Credenciais invalidas'))
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Credenciais invalidas'))
  })
})
