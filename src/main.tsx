import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { App } from './App'
import { useThemeStore } from './store/themeStore'
import './styles/global.css'

const queryClient = new QueryClient()

// Aplica tema salvo antes do primeiro render
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('finanzia_theme') : null
if (stored === 'dark' || stored === 'light') {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(stored)
} else {
  document.documentElement.classList.add('light')
}

// Mantém document em sync quando o tema mudar
useThemeStore.subscribe((state) => {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(state.theme)
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)

