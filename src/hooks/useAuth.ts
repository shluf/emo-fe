import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const useAuth = (requireAuth = true) => {
  const { isAuthenticated, user, token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      navigate('/auth')
    } else if (!requireAuth && isAuthenticated) {
      navigate('/app')
    }
  }, [isAuthenticated, requireAuth, navigate])

  return { isAuthenticated, user, token }
}