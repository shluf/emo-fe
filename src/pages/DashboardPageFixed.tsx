import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Brain, Music, TrendingUp, LogOut, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { FloatingMusicPlayer } from '../components/ui/FloatingMusicPlayer'
import { useTranslation } from '../utils/translations'
import api from '../lib/api'

interface PredictionHistory {
  id: number
  input_text: string
  prediction: string
  created_at: string
  tags: Array<{ id: number; tag_name: string }>
}

interface MusicItem {
  id: number
  title: string
  artist: string
  genre: string
  created_at: string
}

interface UserStats {
  total_users: number
}

export const DashboardPageFixed = memo(() => {
  const { user, logout } = useAuthStore()
  const { t } = useTranslation()
  const [showMusicPlayer, setShowMusicPlayer] = useState(false)

  // Fetch prediction history
  const { data: predictionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['prediction-history'],
    queryFn: async () => {
      const response = await api.get<PredictionHistory[]>('/predict/history')
      return response.data
    },
  })

  // Fetch music list
  const { data: musicList, isLoading: musicLoading } = useQuery({
    queryKey: ['music-list'],
    queryFn: async () => {
      const response = await api.get<MusicItem[]>('/music/')
      return response.data
    },
  })

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await api.get<UserStats>('/users/count')
      return response.data
    },
  })

  // Calculate statistics from prediction history
  const stats = {
    totalPredictions: predictionHistory?.length || 0,
    recentPredictions: predictionHistory?.slice(0, 5) || [],
    moodTrend: (predictionHistory?.length || 0) > 0 ? 'Active' : 'No Data',
    totalMusic: musicList?.length || 0,
    totalUsers: userStats?.total_users || 0
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                {t('appTitle')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageToggle />
              <Link to="/app/profile" className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-secondary-700 rounded-lg p-2 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl p-6 text-white mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {t('welcomeBackUser', { name: user?.name || 'User' })}
          </h1>
          <p className="text-blue-100 mb-4">
            {t('howAreYouFeeling')}
          </p>
          <Link to="/app/prediction">
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              {t('analyzeMood')}
            </button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('moodTrend')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.moodTrend}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('myAnalyses')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPredictions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('availableMusic')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMusic}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Predictions */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('recentMoodAnalysis')}
            </h3>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : stats.recentPredictions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPredictions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{item.prediction}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                        "{item.input_text}"
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{t('noMoodAnalysis')}</p>
                <p className="text-sm">{t('startAnalyzing')}</p>
              </div>
            )}
          </div>

          {/* Available Music */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('availableMusic')}
            </h3>
            {musicLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : musicList && musicList.length > 0 ? (
              <div className="space-y-3">
                {musicList.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.artist}</p>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      {item.genre || t('music')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Music className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{t('noMusicAvailable')}</p>
                <p className="text-sm">{t('uploadMusic')}</p>
              </div>
            )}
            
            {musicList && musicList.length > 0 && (
              <div className="space-y-2 mt-4">
                <Link to="/app/music">
                  <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                    {t('viewAllMusic')} ({musicList.length})
                  </button>
                </Link>
                <button 
                  onClick={() => setShowMusicPlayer(true)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('startMoodMusic')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/app/prediction">
            <button className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
              <Brain className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">{t('analyzeMoodAction')}</p>
              <p className="text-sm text-blue-100">{t('predictEmotionalState')}</p>
            </button>
          </Link>
          
          <Link to="/app/music">
            <button className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
              <Music className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">{t('browseMusic')}</p>
              <p className="text-sm text-purple-100">{t('discoverMusic')}</p>
            </button>
          </Link>
          
          <Link to="/app/history">
            <button className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">{t('viewHistory')}</p>
              <p className="text-sm text-green-100">{t('trackProgress')}</p>
            </button>
          </Link>
        </div>
      </main>

      {/* Floating Music Player */}
      <FloatingMusicPlayer
        isVisible={showMusicPlayer}
        onClose={() => setShowMusicPlayer(false)}
      />
    </div>
  )
})

DashboardPageFixed.displayName = 'DashboardPageFixed'