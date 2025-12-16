import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Music, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const DashboardPage = memo(() => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-primary-100 mb-4">
          How are you feeling today? Let's check in with your mental wellness.
        </p>
        <Link to="/app/prediction">
          <Button variant="secondary" size="lg">
            Analyze My Mood
            <Brain className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Mood Trend</p>
              <p className="text-2xl font-bold text-secondary-900">Positive</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Analyses</p>
              <p className="text-2xl font-bold text-secondary-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Songs Played</p>
              <p className="text-2xl font-bold text-secondary-900">47</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Mood Analysis
          </h3>
          <div className="space-y-3">
            {[
              { emotion: 'Happy', confidence: 85, time: '2 hours ago' },
              { emotion: 'Calm', confidence: 92, time: '1 day ago' },
              { emotion: 'Excited', confidence: 78, time: '2 days ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">{item.emotion}</p>
                  <p className="text-sm text-secondary-600">{item.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">{item.confidence}%</p>
                  <p className="text-xs text-secondary-500">confidence</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recommended Music
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Peaceful Morning', artist: 'Nature Sounds', emotion: 'Calm' },
              { title: 'Uplifting Vibes', artist: 'Happy Tunes', emotion: 'Happy' },
              { title: 'Focus Flow', artist: 'Concentration', emotion: 'Focused' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">{item.title}</p>
                  <p className="text-sm text-secondary-600">{item.artist}</p>
                </div>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {item.emotion}
                </span>
              </div>
            ))}
          </div>
          <Link to="/app/music" className="block mt-4">
            <Button variant="outline" className="w-full">
              View All Music
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'