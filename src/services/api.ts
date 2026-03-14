import axios from 'axios'
import { useAuthStore } from '@store/authStore'

const backendUrl =
  import.meta.env.VITE_API_URL ??
  import.meta.env.REACT_APP_BACKEND_URL ??
  'http://localhost:4000'

export const api = axios.create({
  baseURL: backendUrl,
})

api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token || localStorage.getItem('finanzia_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

