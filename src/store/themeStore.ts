import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'finanzia_theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getStoredTheme()
  return {
    theme: initial,
    setTheme: (theme) => {
      applyTheme(theme)
      localStorage.setItem(STORAGE_KEY, theme)
      set({ theme })
    },
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light'
      get().setTheme(next)
    },
  }
})

// Aplica o tema salvo quando o módulo é carregado (fallback se main.tsx rodar depois)
if (typeof window !== 'undefined' && !document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
  applyTheme(getStoredTheme())
}
