import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmEmailPage } from './confirm-email-page'
import { authApi } from '@/api/auth.api'

vi.mock('@/api/auth.api', () => ({
  authApi: {
    confirmEmail: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

function renderConfirm(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ConfirmEmailPage />
    </MemoryRouter>,
  )
}

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when token is missing', () => {
    renderConfirm('/confirm-email')

    expect(screen.getByRole('alert')).toHaveTextContent('Token de confirmacao ausente')
    expect(mockedAuthApi.confirmEmail).not.toHaveBeenCalled()
  })

  it('confirms email using token from URL', async () => {
    mockedAuthApi.confirmEmail.mockResolvedValueOnce()
    renderConfirm('/confirm-email?token=abc')

    await waitFor(() => expect(mockedAuthApi.confirmEmail).toHaveBeenCalledWith('abc'))
    expect(await screen.findByText('Email confirmado com sucesso')).toBeInTheDocument()
  })

  it('shows confirmation errors', async () => {
    mockedAuthApi.confirmEmail.mockRejectedValueOnce(new Error('Token invalido'))
    renderConfirm('/confirm-email?token=abc')

    expect(await screen.findByRole('alert')).toHaveTextContent('Token invalido')
  })
})
