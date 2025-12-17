import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { User, Lock, Save, ArrowLeft, Brain, Music, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../utils/translations'
import api from '../lib/api'

interface UserStats {
  total_predictions: number
  total_music_played: number
  days_active: number
  positive_mood_percentage: number
}

export const ProfilePageFixed = memo(() => {
  const { user, updateUser } = useAuthStore()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const response = await api.get<UserStats>(`/users/${user?.id}/stats`)
      return response.data
    },
    enabled: !!user?.id,
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await api.put(`/users/${user?.id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setErrors({})
    },
    onError: (error: any) => {
      setErrors({ profile: error.response?.data?.detail || 'Update failed' })
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await api.put('/auth/change-password', data)
      return response.data
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
    },
    onError: (error: any) => {
      setErrors({ password: error.response?.data?.detail || 'Password update failed' })
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    updateProfileMutation.mutate(formData)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: t('passwordsDoNotMatch') })
      return
    }

    updatePasswordMutation.mutate({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link 
                to="/app" 
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t('backToDashboard')}
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('profile')}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('profileSettings')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('manageAccountInfo')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center mb-6">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('profileInformation')}
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label={t('fullName')}
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
              />

              <Input
                label={t('email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              {errors.profile && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {errors.profile}
                </div>
              )}

              <Button
                type="submit"
                loading={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('saveChanges')}
              </Button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center mb-6">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('changePassword')}
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label={t('currentPassword')}
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />

              <Input
                label={t('newPassword')}
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />

              <Input
                label={t('confirmNewPassword')}
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />

              {errors.password && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {errors.password}
                </div>
              )}

              <Button
                type="submit"
                loading={updatePasswordMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Lock className="w-4 h-4 mr-2" />
                {t('updatePassword')}
              </Button>
            </form>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="mt-8 bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('accountStatistics')}
          </h2>
          
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.total_predictions || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('moodAnalyses')}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.total_music_played || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('songsPlayed')}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.days_active || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('daysActive')}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.positive_mood_percentage || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('positiveMood')}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
})

ProfilePageFixed.displayName = 'ProfilePageFixed'