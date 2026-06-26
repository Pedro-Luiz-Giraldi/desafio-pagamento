export interface LoginRequest {
  email: string
  password: string
  totpCode?: string
}

export interface LoginResponse {
  accessToken?: string
  tokenType?: string
  expiresIn?: number
  requiresTwoFactor?: boolean
  twoFactorToken?: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role: 'MERCHANT'
}

export interface RegisterResponse {
  userId: string
  email: string
  role: string
  merchantId?: string
  emailConfirmed: boolean
}

export interface UserProfile {
  userId: string
  email: string
  fullName: string
  role: string
  twoFactorEnabled: boolean
  emailConfirmed: boolean
  createdAt: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qrCodeUrl: string
  otpAuthUrl: string
  recoveryCodes: string[]
}

export interface TwoFactorVerifyRequest {
  twoFactorToken: string
  totpCode: string
}
