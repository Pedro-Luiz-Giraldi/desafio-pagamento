import client from './client'
import type { ApiResponse } from '@/types/api'
import type { UserProfile, TwoFactorSetupResponse } from '@/types/auth'

export const usersApi = {
  async getProfile(): Promise<UserProfile> {
    const response = await client.get<UserProfile>('/api/v1/users/me')
    return response.data
  },

  async updateProfile(input: { fullName: string }): Promise<ApiResponse<UserProfile>> {
    const response = await client.put<ApiResponse<UserProfile>>('/api/v1/users/me', input)
    return response.data
  },

  async setupTwoFactor(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    const response = await client.post<ApiResponse<TwoFactorSetupResponse>>('/api/v1/auth/2fa/setup')
    return response.data
  },

  async confirmTwoFactor(totpCode: string): Promise<void> {
    await client.post('/api/v1/auth/2fa/confirm', { code: totpCode })
  },

  async disableTwoFactor(): Promise<void> {
    await client.post('/api/v1/auth/2fa/disable')
  },
}
