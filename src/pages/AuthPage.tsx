import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types'

export const AuthPage = memo(() => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const formData = new FormData()
      formData.append('username', data.email)
      formData.append('password', data.password)
      
      const response = await api.post<AuthResponse>('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      return response.data
    },
    onSuccess: (data) => {
      login(data.user, data.access_token)
      navigate('/app')
    },
    onError: (error: any) => {
      setErrors({ general: error.response?.data?.detail || 'Login failed' })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      login(data.user, data.access_token)
      navigate('/app')
    },
    onError: (error: any) => {
      setErrors({ general: error.response?.data?.detail || 'Registration failed' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      })
    } else {
      registerMutation.mutate({
        name: formData.name,
        email: formData.email,
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-secondary-900">
              MindCare
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-secondary-600 mt-2">
              {isLogin 
                ? 'Sign in to continue your mental wellness journey' 
                : 'Start your mental wellness journey today'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={errors.name}
              />
            )}

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              error={errors.email}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              error={errors.password}
            />

            {errors.general && (
              <div className="text-red-600 text-sm text-center">
                {errors.general}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending || registerMutation.isPending}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

AuthPage.displayName = 'AuthPage'