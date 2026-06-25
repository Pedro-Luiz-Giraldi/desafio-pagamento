import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TwoFactorSetupPage } from './two-factor-setup-page'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/api/users.api', () => ({
  usersApi: {
    setupTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
  },
}))

import { usersApi } from '@/api/users.api'

const mockedUsersApi = vi.mocked(usersApi)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings/2fa']}>
      <Routes>
        <Route path="/settings/2fa" element={<TwoFactorSetupPage />} />
        <Route path="/settings" element={<div>Settings</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TwoFactorSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setUser({
      userId: 'u-1', email: 'm@m.com', fullName: 'User', role: 'MERCHANT',
      twoFactorEnabled: false, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
  })

  it('shows initial setup button', () => {
    renderPage()
    expect(screen.getByText('Começar Configuração')).toBeInTheDocument()
  })

  it('shows QR code after setup', async () => {
    mockedUsersApi.setupTwoFactor.mockResolvedValueOnce({
      data: { qrCodeUrl: 'http://example.com/qr.png', secret: 'SECRET123', recoveryCodes: ['code1', 'code2'], otpAuthUrl: 'otpauth://' },
    } as any)
    renderPage()
    await userEvent.click(screen.getByText('Começar Configuração'))
    await waitFor(() => expect(screen.getByText('Escaneie o QR Code')).toBeInTheDocument())
    expect(screen.getByText('SECRET123')).toBeInTheDocument()
  })

  it('confirms 2FA with TOTP code', async () => {
    mockedUsersApi.setupTwoFactor.mockResolvedValueOnce({
      data: { qrCodeUrl: 'url', secret: 'SECRET', recoveryCodes: ['code1'], otpAuthUrl: 'otpauth://' },
    } as any)
    mockedUsersApi.confirmTwoFactor.mockResolvedValueOnce(undefined as any)
    renderPage()
    await userEvent.click(screen.getByText('Começar Configuração'))
    await waitFor(() => expect(screen.getByText('Escaneie o QR Code')).toBeInTheDocument())
    await userEvent.type(screen.getByLabelText('Código de Verificação'), '123456')
    await userEvent.click(screen.getByText('Verificar e Ativar'))
    await waitFor(() => expect(screen.getByText('2FA Ativado!')).toBeInTheDocument())
  })

  it('shows recovery codes after activation', async () => {
    mockedUsersApi.setupTwoFactor.mockResolvedValueOnce({
      data: { qrCodeUrl: 'url', secret: 'SECRET', recoveryCodes: ['rc-111', 'rc-222'], otpAuthUrl: 'otpauth://' },
    } as any)
    mockedUsersApi.confirmTwoFactor.mockResolvedValueOnce(undefined as any)
    renderPage()
    await userEvent.click(screen.getByText('Começar Configuração'))
    await waitFor(() => expect(screen.getByText('Escaneie o QR Code')).toBeInTheDocument())
    await userEvent.type(screen.getByLabelText('Código de Verificação'), '123456')
    await userEvent.click(screen.getByText('Verificar e Ativar'))
    await waitFor(() => expect(screen.getByText('rc-111')).toBeInTheDocument())
    expect(screen.getByText('rc-222')).toBeInTheDocument()
  })

  it('shows disable option when 2FA is already enabled', () => {
    useAuthStore.getState().setUser({
      userId: 'u-1', email: 'm@m.com', fullName: 'User', role: 'MERCHANT',
      twoFactorEnabled: true, emailConfirmed: true, createdAt: '2024-01-01T00:00:00Z',
    })
    renderPage()
    expect(screen.getByText('Desativar 2FA')).toBeInTheDocument()
  })
})
