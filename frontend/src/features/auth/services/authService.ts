import { api } from '@lib/api'
import { API_BASE_URL } from '@lib/constants'
import type { UserProfile } from '@lib/types/auth.types'

// --- Login ---

export type LoginServiceResult =
  | { type: 'success'; accessToken: string; user: UserProfile }
  | { type: '2fa'; twoFactorToken: string }
  | { type: 'error'; errorCode: string; message: string }

async function login(email: string, password: string): Promise<LoginServiceResult> {
  const result = await api<{
    accessToken?: string
    user?: UserProfile
    twoFactorRequired?: boolean
    twoFactorToken?: string
  }>('/api/v1/auth/login', { method: 'POST', body: { email, password } })

  if (!result.ok) {
    return { type: 'error', errorCode: result.error.errorCode, message: result.error.message }
  }
  if (result.data.twoFactorRequired) {
    return { type: '2fa', twoFactorToken: result.data.twoFactorToken! }
  }
  return { type: 'success', accessToken: result.data.accessToken!, user: result.data.user! }
}

// --- Logout ---

async function logout(): Promise<void> {
  await api('/api/v1/auth/logout', { method: 'POST' })
}

// --- Refresh (raw fetch to avoid 401-refresh loop in api.ts) ---

async function refreshToken(): Promise<{ accessToken: string; user: UserProfile } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) return null
    const body = await response.json()
    const data = body?.data ?? body
    if (!data?.accessToken || !data?.user) return null
    return { accessToken: data.accessToken, user: data.user }
  } catch {
    return null
  }
}

// --- Register ---

export type RegisterResult =
  | { type: 'success' }
  | { type: 'error'; errorCode: string; message: string }

async function register(name: string, email: string, password: string): Promise<RegisterResult> {
  const result = await api('/api/v1/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
  if (!result.ok) {
    return { type: 'error', errorCode: result.error.errorCode, message: result.error.message }
  }
  return { type: 'success' }
}

async function resendConfirmation(email: string): Promise<void> {
  await api('/api/v1/auth/resend-confirmation', { method: 'POST', body: { email } })
}

async function confirmEmail(token: string): Promise<RegisterResult> {
  const result = await api(`/api/v1/auth/confirm-email?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  })
  if (!result.ok) {
    return { type: 'error', errorCode: result.error.errorCode, message: result.error.message }
  }
  return { type: 'success' }
}

// --- 2FA Verify (during login) ---

export type TwoFactorResult =
  | { type: 'success'; accessToken: string; user: UserProfile }
  | { type: 'error'; errorCode: string; message: string }

async function verify2FA(code: string, twoFactorToken: string): Promise<TwoFactorResult> {
  const result = await api<{ accessToken: string; user: UserProfile }>(
    '/api/v1/auth/2fa/verify',
    { method: 'POST', body: { code, twoFactorToken } }
  )
  if (!result.ok) {
    return { type: 'error', errorCode: result.error.errorCode, message: result.error.message }
  }
  return { type: 'success', accessToken: result.data.accessToken, user: result.data.user }
}

// --- 2FA Recovery (during login) ---

export type RecoveryResult =
  | { type: 'success'; accessToken: string; user: UserProfile; remainingCodes: number }
  | { type: 'error'; errorCode: string; message: string }

async function verify2FARecovery(recoveryCode: string, twoFactorToken: string): Promise<RecoveryResult> {
  const result = await api<{ accessToken: string; user: UserProfile; remainingCodes: number }>(
    '/api/v1/auth/2fa/recovery',
    { method: 'POST', body: { recoveryCode, twoFactorToken } }
  )
  if (!result.ok) {
    return { type: 'error', errorCode: result.error.errorCode, message: result.error.message }
  }
  return { type: 'success', ...result.data }
}

// --- 2FA Setup (profile) ---

async function setup2FA(): Promise<{ qrCodeUrl: string; secret: string } | null> {
  const result = await api<{ qrCodeUrl: string; secret: string }>('/api/v1/auth/2fa/setup', {
    method: 'POST',
  })
  return result.ok ? result.data : null
}

async function confirm2FA(code: string): Promise<{ recoveryCodes: string[] } | null> {
  const result = await api<{ recoveryCodes: string[] }>('/api/v1/auth/2fa/confirm', {
    method: 'POST',
    body: { code },
  })
  return result.ok ? result.data : null
}

async function disable2FA(password: string): Promise<boolean> {
  const result = await api('/api/v1/auth/2fa/disable', { method: 'POST', body: { password } })
  return result.ok
}

export const authService = {
  login,
  logout,
  refreshToken,
  register,
  resendConfirmation,
  confirmEmail,
  verify2FA,
  verify2FARecovery,
  setup2FA,
  confirm2FA,
  disable2FA,
}
