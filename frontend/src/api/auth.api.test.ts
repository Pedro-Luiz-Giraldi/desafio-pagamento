import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { authApi } from './auth.api'

vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
  },
}))

const mockedClient = vi.mocked(client)

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers merchants with a fixed merchant role', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { userId: 'user-1' } })

    await authApi.register({
      fullName: 'Merchant User',
      email: 'merchant@example.com',
      password: 'Senha@1234',
    })

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/register', {
      fullName: 'Merchant User',
      email: 'merchant@example.com',
      password: 'Senha@1234',
      role: 'MERCHANT',
    })
  })

  it('confirms email with token payload', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: undefined })

    await authApi.confirmEmail('token-123')

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/confirm-email', {
      token: 'token-123',
    })
  })

  it('logs in with email and password', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { accessToken: 'jwt' } })

    await authApi.login({ email: 'merchant@example.com', password: 'Senha@1234' })

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'merchant@example.com',
      password: 'Senha@1234',
    })
  })

  it('verifies two-factor token and code', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { accessToken: 'jwt' } })

    await authApi.verifyTwoFactor({ twoFactorToken: 'tmp-token', totpCode: '123456' })

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/2fa/verify', {
      twoFactorToken: 'tmp-token',
      code: '123456',
    })
  })

  it('refreshes using the httpOnly cookie', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { accessToken: 'jwt' } })

    await authApi.refresh()

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {}, { withCredentials: true })
  })

  it('logs out using the httpOnly cookie', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: undefined })

    await authApi.logout()

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/logout', {}, { withCredentials: true })
  })
})
