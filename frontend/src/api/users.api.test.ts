import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { usersApi } from './users.api'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedClient = vi.mocked(client)

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets profile', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: { userId: 'u-1', fullName: 'John' } } })
    const result = await usersApi.getProfile()
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/users/me')
    expect(result.data.fullName).toBe('John')
  })

  it('updates profile name', async () => {
    mockedClient.put.mockResolvedValueOnce({ data: { data: { fullName: 'New Name' } } })
    const result = await usersApi.updateProfile({ fullName: 'New Name' })
    expect(mockedClient.put).toHaveBeenCalledWith('/api/v1/users/me', { fullName: 'New Name' })
    expect(result.data.fullName).toBe('New Name')
  })

  it('sets up two-factor', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: { data: { qrCodeUrl: 'url', recoveryCodes: ['code1'] } } })
    const result = await usersApi.setupTwoFactor()
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/2fa/setup')
    expect(result.data.recoveryCodes).toEqual(['code1'])
  })

  it('confirms two-factor with code', async () => {
    mockedClient.post.mockResolvedValueOnce({})
    await usersApi.confirmTwoFactor('123456')
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/2fa/confirm', { code: '123456' })
  })

  it('disables two-factor', async () => {
    mockedClient.post.mockResolvedValueOnce({})
    await usersApi.disableTwoFactor()
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/2fa/disable')
  })
})
