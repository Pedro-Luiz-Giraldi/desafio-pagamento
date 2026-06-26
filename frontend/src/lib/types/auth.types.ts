export type UserRole = 'CUSTOMER' | 'MERCHANT_OWNER' | 'STAFF'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  merchantId: string | null
  twoFactorEnabled: boolean
  emailConfirmed: boolean
}

export type LoginResult =
  | { success: true }
  | { twoFactorRequired: true; twoFactorToken: string }
  | { error: true; errorCode: string; message: string }

export interface AuthContextValue {
  user: UserProfile | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<LoginResult>
  logout(): Promise<void>
  refreshToken(): Promise<boolean>
  setTokens(accessToken: string, user: UserProfile): void
}
