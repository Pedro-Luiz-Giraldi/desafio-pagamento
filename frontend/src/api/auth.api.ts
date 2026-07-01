import client from './client'
import type { LoginRequest, LoginResponse, RegisterResponse, TwoFactorVerifyRequest } from '@/types/auth'

interface RegisterInput {
  fullName: string
  email: string
  password: string
  role: 'CUSTOMER' | 'MERCHANT_OWNER'
  companyName?: string
  cnpj?: string
}

export const authApi = {
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await client.post<RegisterResponse>('/api/v1/auth/register', input)
    return response.data
  },

  async confirmEmail(token: string): Promise<void> {
    await client.post('/api/v1/auth/confirm-email', { token })
  },

  async login(input: LoginRequest): Promise<LoginResponse> {
    const response = await client.post<LoginResponse>('/api/v1/auth/login', input)
    return response.data
  },

  async verifyTwoFactor(input: TwoFactorVerifyRequest): Promise<LoginResponse> {
    const response = await client.post<LoginResponse>('/api/v1/auth/2fa/verify', {
      twoFactorToken: input.twoFactorToken,
      code: input.totpCode,
    })
    return response.data
  },

  async refresh(): Promise<LoginResponse> {
    const response = await client.post<LoginResponse>('/api/v1/auth/refresh', {}, { withCredentials: true })
    return response.data
  },

  async logout(): Promise<void> {
    await client.post('/api/v1/auth/logout', {}, { withCredentials: true })
  },
}
