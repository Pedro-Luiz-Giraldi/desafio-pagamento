import { create } from 'zustand'
import type { UserProfile } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  twoFactorToken: string | null
  isLoading: boolean
  setToken: (token: string | null) => void
  setUser: (user: UserProfile | null) => void
  setTwoFactorToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  twoFactorToken: null,
  isLoading: false,
  setToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setTwoFactorToken: (twoFactorToken) => set({ twoFactorToken }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ accessToken: null, user: null, twoFactorToken: null, isLoading: false }),
}))
