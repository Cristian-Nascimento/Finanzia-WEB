import { create } from 'zustand'

export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

type AuthState = {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (data: { user: User; token: string }) => void
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('finanzia_user') || 'null')
      : null,
  token:
    typeof window !== 'undefined'
      ? localStorage.getItem('finanzia_token')
      : null,
  isLoading: false,
  setAuth: ({ user, token }) =>
    set(() => {
      localStorage.setItem('finanzia_token', token)
      localStorage.setItem('finanzia_user', JSON.stringify(user))
      return { user, token }
    }),
  updateUser: (updates) =>
    set((s) => {
      if (!s.user) return s
      const user = { ...s.user, ...updates }
      localStorage.setItem('finanzia_user', JSON.stringify(user))
      return { ...s, user }
    }),
  clearAuth: () =>
    set(() => {
      localStorage.removeItem('finanzia_token')
      localStorage.removeItem('finanzia_user')
      return { user: null, token: null }
    }),
}))

