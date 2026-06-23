import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authRef } from '@lib/authRef'
import { authService } from '@features/auth/services/authService'
import type { AuthContextValue, LoginResult, UserProfile } from '@lib/types/auth.types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessTokenRef = useRef<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setTokens = useCallback((token: string, profile: UserProfile) => {
    accessTokenRef.current = token
    setUser(profile)
  }, [])

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // always clear local state even if the request fails
    }
    clearAuth()
  }, [clearAuth])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const result = await authService.refreshToken()
    if (result) {
      setTokens(result.accessToken, result.user)
      return true
    }
    clearAuth()
    return false
  }, [setTokens, clearAuth])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await authService.login(email, password)
    if (result.type === 'success') {
      setTokens(result.accessToken, result.user)
      return { success: true }
    }
    if (result.type === '2fa') {
      return { twoFactorRequired: true, twoFactorToken: result.twoFactorToken }
    }
    return { error: true, errorCode: result.errorCode, message: result.message }
  }, [setTokens])

  // Register functions in the bridge so api.ts can use them without circular imports
  useEffect(() => {
    authRef.getToken = () => accessTokenRef.current
    authRef.refresh = refreshToken
    authRef.logout = logout
  }, [refreshToken, logout])

  // Silent refresh on app init to restore session from HttpOnly cookie
  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAuthenticated = user !== null
  const role = user?.role ?? null

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading, login, logout, refreshToken, setTokens }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
