import { memo, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  TrendingUp, 
  Brain, 
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useTranslation } from '../utils/translations'
import api from '../lib/api'

interface PredictionHistory {
  id: number
  input_text: string
  prediction: string
  created_at: string
  tags: Array<{ id: number; tag_name: string }>
}

interface EmotionStats {
  emotion: string
  count: number
  percentage: number
}

interface DailyStats {
  date: string
  emotions: Record<string, number>
  total: number
}

type ChartPeriod = 'daily' | 'weekly' | 'monthly'

export const HistoryPageFixed = memo(() => {
  const { t } = useTranslation()
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  })
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('daily')

  // Fetch prediction history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['prediction-history', dateFilter.start, dateFilter.end],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFilter.start) params.append('date_start', dateFilter.start)
      if (dateFilter.end) params.append('date_end', dateFilter.end)
      
      const response = await api.get<PredictionHistory[]>(`/predict/history?${params}`)
      return response.data
    },
  })

  // Process data for statistics
  const stats = useMemo(() => {
    if (!historyData) return { emotionStats: [], dailyStats: [], totalAnalyses: 0 }

    const emotionCounts: Record<string, number> = {}
    const dailyData: Record<string, Record<string, number>> = {}

    historyData.forEach(item => {
      const emotion = item.prediction.toLowerCase()
      const date = new Date(item.created_at).toISOString().split('T')[0]

      // Count emotions
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1

      // Daily stats
      if (!dailyData[date]) {
        dailyData[date] = {}
      }
      dailyData[date][emotion] = (dailyData[date][emotion] || 0) + 1
    })

    const total = historyData.length
    const emotionStats: EmotionStats[] = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count)

    const dailyStats: DailyStats[] = Object.entries(dailyData).map(([date, emotions]) => ({
      date,
      emotions,
      total: Object.values(emotions).reduce((sum, count) => sum + count, 0)
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { emotionStats, dailyStats, totalAnalyses: total }
  }, [historyData])

  // Get emotion color for charts
  const getEmotionChartColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: '#fbbf24',      // Bright yellow
      sad: '#3b82f6',        // Blue
      angry: '#ef4444',      // Red
      fear: '#8b5cf6',       // Purple
      surprise: '#10b981',   // Green
      disgust: '#f97316',    // Orange
      neutral: '#6b7280',    // Gray
      joy: '#fbbf24',        // Same as happy
      sadness: '#3b82f6',    // Same as sad
      anger: '#ef4444'       // Same as angry
    }
    return colors[emotion.toLowerCase()] || '#6b7280'
  }

  // Process chart data based on selected period
  const chartData = useMemo(() => {
    if (!historyData) return []

    const processedData: Record<string, Record<string, number>> = {}
    
    historyData.forEach(item => {
      const date = new Date(item.created_at)
      const emotion = item.prediction.toLowerCase()
      
      let key: string
      
      switch (chartPeriod) {
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      if (!processedData[key]) {
        processedData[key] = {}
      }
      
      processedData[key][emotion] = (processedData[key][emotion] || 0) + 1
    })

    // Convert to array format for Recharts
    return Object.entries(processedData)
      .map(([date, emotions]) => ({
        date,
        ...emotions,
        total: Object.values(emotions).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Show last 30 periods
  }, [historyData, chartPeriod])

  // Pie chart data for emotion distribution
  const pieChartData = useMemo(() => {
    return stats.emotionStats.map(stat => ({
      name: stat.emotion,
      value: stat.count,
      percentage: stat.percentage,
      color: getEmotionChartColor(stat.emotion)
    }))
  }, [stats.emotionStats])

  // Get emotion color for UI elements
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      sad: 'bg-gradient-to-r from-blue-400 to-blue-500',
      angry: 'bg-gradient-to-r from-red-400 to-red-500',
      fear: 'bg-gradient-to-r from-purple-400 to-purple-500',
      surprise: 'bg-gradient-to-r from-green-400 to-green-500',
      disgust: 'bg-gradient-to-r from-orange-400 to-orange-500',
      neutral: 'bg-gradient-to-r from-gray-400 to-gray-500',
      joy: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      sadness: 'bg-gradient-to-r from-blue-400 to-blue-500',
      anger: 'bg-gradient-to-r from-red-400 to-red-500'
    }
    return colors[emotion.toLowerCase()] || 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  const getEmotionTextColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      sad: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      angry: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      fear: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      surprise: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      disgust: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
      joy: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      sadness: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      anger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    }
    return colors[emotion.toLowerCase()] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }

  // Filter history by selected emotion
  const filteredHistory = useMemo(() => {
    if (!historyData || !selectedEmotion) return historyData || []
    return historyData.filter(item => 
      item.prediction.toLowerCase() === selectedEmotion.toLowerCase()
    )
  }, [historyData, selectedEmotion])

  const handleDateFilterChange = (field: 'start' | 'end', value: string) => {
    setDateFilter(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setDateFilter({ start: '', end: '' })
    setSelectedEmotion('')
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
                {/* {t('backToDashboard')} */}
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('emotionHistory')}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('emotionHistory')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('trackEmotionalJourney')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('filters')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('startDate')}
              type="date"
              value={dateFilter.start}
              onChange={(e) => handleDateFilterChange('start', e.target.value)}
            />
            <Input
              label={t('endDate')}
              type="date"
              value={dateFilter.end}
              onChange={(e) => handleDateFilterChange('end', e.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                {t('clearFilters')}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {t('totalAnalyses')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalAnalyses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {t('activeDays')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.dailyStats.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {t('topEmotion')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {stats.emotionStats[0]?.emotion || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emotion Trends Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Line Chart */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('emotionTrends')}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('chartPeriod')}:</span>
                    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                      {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((period) => (
                        <button
                          key={period}
                          onClick={() => setChartPeriod(period)}
                          className={`px-3 py-1 text-sm font-medium transition-colors ${
                            chartPeriod === period
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-600'
                          }`}
                        >
                          {t(period)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          switch (chartPeriod) {
                            case 'daily':
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            case 'weekly':
                              return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            case 'monthly':
                              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                            default:
                              return value
                          }
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString()
                        }}
                      />
                      <Legend />
                      {stats.emotionStats.slice(0, 5).map((stat) => (
                        <Area
                          key={stat.emotion}
                          type="monotone"
                          dataKey={stat.emotion}
                          stackId="1"
                          stroke={getEmotionChartColor(stat.emotion)}
                          fill={getEmotionChartColor(stat.emotion)}
                          fillOpacity={0.6}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('emotionDistribution')}
                </h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => [`${value} analyses`, name]}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Emotion Distribution */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {t('emotionDistribution')}
              </h3>
              
              <div className="space-y-4">
                {stats.emotionStats.map((stat) => (
                  <div key={stat.emotion} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium capitalize ${getEmotionTextColor(stat.emotion)}`}>
                          {stat.emotion}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {stat.count} ({stat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${getEmotionColor(stat.emotion)}`}
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEmotion(
                        selectedEmotion === stat.emotion ? '' : stat.emotion
                      )}
                      className={`ml-4 px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedEmotion === stat.emotion
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {selectedEmotion === stat.emotion ? t('selected') : t('filter')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent History */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedEmotion ? `${t('recentAnalyses')} - ${selectedEmotion}` : t('recentAnalyses')}
                </h3>
                {selectedEmotion && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmotion('')}
                  >
                    {t('showAll')}
                  </Button>
                )}
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredHistory.slice(0, 20).map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getEmotionTextColor(item.prediction)}`}>
                        {item.prediction}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                      "{item.input_text}"
                    </p>
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
})

HistoryPageFixed.displayName = 'HistoryPageFixed'