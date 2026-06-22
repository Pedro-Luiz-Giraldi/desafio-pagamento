import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth.store'
import type { UserProfile } from '@/types/auth'

const user: UserProfile = {
  userId: 'user-1',
  email: 'merchant@example.com',
  fullName: 'Merchant User',
  role: 'MERCHANT',
  twoFactorEnabled: true,
  emailConfirmed: true,
  createdAt: '2026-06-22T00:00:00Z',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('starts without session data', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().twoFactorToken).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('updates session data', () => {
    useAuthStore.getState().setToken('access-token')
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setLoading(true)

    expect(useAuthStore.getState().accessToken).toBe('access-token')
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().isLoading).toBe(true)
  })

  it('stores pending two-factor token', () => {
    useAuthStore.getState().setTwoFactorToken('tmp-token')

    expect(useAuthStore.getState().twoFactorToken).toBe('tmp-token')
  })

  it('clears all session data', () => {
    useAuthStore.getState().setToken('access-token')
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setTwoFactorToken('tmp-token')
    useAuthStore.getState().setLoading(true)

    useAuthStore.getState().clear()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().twoFactorToken).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
