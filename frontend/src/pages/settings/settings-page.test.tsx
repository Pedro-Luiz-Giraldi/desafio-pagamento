import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './settings-page'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/users.api', () => ({
  usersApi: {
    updateProfile: vi.fn(),
  },
}))

import { usersApi } from '@/api/users.api'

const mockedUsersApi = vi.mocked(usersApi)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/2fa" element={<div>2FA Setup</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setUser({
      userId: 'u-1', email: 'merchant@test.com', fullName: 'João Silva', role: 'MERCHANT',
      twoFactorEnabled: false, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
  })

  it('renders user email and name', () => {
    renderPage()
    expect(screen.getByDisplayValue('merchant@test.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
  })

  it('updates profile on submit', async () => {
    mockedUsersApi.updateProfile.mockResolvedValueOnce({ data: { fullName: 'Novo Nome' } } as any)
    renderPage()
    const nameInput = screen.getByLabelText('Nome Completo')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Novo Nome')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(mockedUsersApi.updateProfile).toHaveBeenCalledWith({ fullName: 'Novo Nome' }))
  })

  it('shows 2FA section', () => {
    renderPage()
    expect(screen.getByText('Autenticação de Dois Fatores (2FA)')).toBeInTheDocument()
    expect(screen.getByText('Configurar')).toBeInTheDocument()
  })

  it('shows manage button when 2FA enabled', () => {
    useAuthStore.getState().setUser({
      userId: 'u-1', email: 'm@m.com', fullName: 'User', role: 'MERCHANT',
      twoFactorEnabled: true, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
    renderPage()
    expect(screen.getByText('Gerenciar')).toBeInTheDocument()
  })

  it('navigates to 2FA setup page', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Configurar'))
    expect(screen.getByText('2FA Setup')).toBeInTheDocument()
  })
})
