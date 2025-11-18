import { create } from 'zustand'
import type { User } from 'firebase/auth'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

/**
 * Auth Store Factory
 * 각 프로젝트가 독립적인 auth 상태를 가질 수 있도록 factory 패턴 사용
 */
export function createAuthStore() {
  return create<AuthState>((set) => ({
    user: null,
    loading: true,
    error: null,
    setUser: (user) => set({ user, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => set({ user: null, loading: false, error: null }),
  }))
}
