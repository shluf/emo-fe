import { memo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export const ProfilePage = memo(() => {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
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
      setErrors({ password: 'Passwords do not match' })
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-lg text-secondary-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center mb-6">
          <User className="w-5 h-5 text-secondary-600 mr-2" />
          <h2 className="text-xl font-semibold text-secondary-900">
            Profile Information
          </h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          {errors.profile && (
            <div className="text-red-600 text-sm">
              {errors.profile}
            </div>
          )}

          <Button
            type="submit"
            loading={updateProfileMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center mb-6">
          <Lock className="w-5 h-5 text-secondary-600 mr-2" />
          <h2 className="text-xl font-semibold text-secondary-900">
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
          />

          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
          />

          {errors.password && (
            <div className="text-red-600 text-sm">
              {errors.password}
            </div>
          )}

          <Button
            type="submit"
            loading={updatePasswordMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </form>
      </div>

      {/* Account Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h2 className="text-xl font-semibold text-secondary-900 mb-6">
          Account Statistics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-2xl font-bold text-secondary-900">12</p>
            <p className="text-sm text-secondary-600">Mood Analyses</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-2xl font-bold text-secondary-900">47</p>
            <p className="text-sm text-secondary-600">Songs Played</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-2xl font-bold text-secondary-900">7</p>
            <p className="text-sm text-secondary-600">Days Active</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-2xl font-bold text-secondary-900">85%</p>
            <p className="text-sm text-secondary-600">Positive Mood</p>
          </div>
        </div>
      </div>
    </div>
  )
})

ProfilePage.displayName = 'ProfilePage'