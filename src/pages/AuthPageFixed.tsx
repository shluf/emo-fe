import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Brain } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../utils/translations'
import api from '../lib/api'

export const AuthPageFixed = memo(() => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { t } = useTranslation()

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await api.post('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      // Create a mock user object since backend doesn't return user info
      const mockUser = {
        id: 1,
        name: formData.username,
        email: `${formData.username}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      login(mockUser, data.access_token)
      navigate('/app')
    },
    onError: (error: any) => {
      setErrors({ general: error.response?.data?.detail || t('loginFailed') })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await api.post('/auth/register', data)
      return response.data
    },
    onSuccess: () => {
      // After registration, automatically login
      loginMutation.mutate({ username: formData.username, password: formData.password })
    },
    onError: (error: any) => {
      setErrors({ general: error.response?.data?.detail || t('registrationFailed') })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (isLogin) {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      })
    } else {
      registerMutation.mutate({
        username: formData.username,
        password: formData.password,
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Theme and Language toggles */}
        <div className="flex justify-end space-x-2 mb-4">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
              {t('appTitle')}
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {isLogin 
                ? t('signInToContinue')
                : t('startYourJourney')
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('username')}
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              required
              error={errors.username}
            />

            <Input
              label={t('password')}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              error={errors.password}
            />

            {errors.general && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {errors.general}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending || registerMutation.isPending}
            >
              {isLogin ? t('signIn') : t('createAccount')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {isLogin 
                ? t('dontHaveAccount')
                : t('alreadyHaveAccount')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

AuthPageFixed.displayName = 'AuthPageFixed'