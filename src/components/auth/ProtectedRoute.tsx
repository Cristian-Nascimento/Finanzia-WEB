import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuthStore } from '@store/authStore'

type Props = {
  children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const location = useLocation()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!user && !token) {
      const storedToken = localStorage.getItem('finanzia_token')
      const storedUser = localStorage.getItem('finanzia_user')
      if (storedToken && storedUser) {
        useAuthStore.setState({
          token: storedToken,
          user: JSON.parse(storedUser),
        })
      }
    }
  }, [user, token])

  if (!user && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

