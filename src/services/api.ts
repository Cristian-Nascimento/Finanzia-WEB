import axios from 'axios'
import { useAuthStore } from '@store/authStore'

export const api = axios.create({
  baseURL: 'http://localhost:4000',
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

