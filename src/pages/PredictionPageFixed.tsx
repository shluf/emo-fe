import { memo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Brain, Send, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import api from '../lib/api'

interface PredictionRequest {
  text: string
  tag_ids?: number[]
}

interface PredictionResponse {
  input: string
  prediction: string
  tags: Array<{ id: number; tag_name: string }>
}

interface Tag {
  id: number
  tag_name: string
  color: string
}

export const PredictionPageFixed = memo(() => {
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [result, setResult] = useState<PredictionResponse | null>(null)

  // Fetch available tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get<Tag[]>('/tags/')
      return response.data
    },
  })

  const predictionMutation = useMutation({
    mutationFn: async (data: PredictionRequest) => {
      const response = await api.post<PredictionResponse>('/predict/', data)
      return response.data
    },
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      predictionMutation.mutate({ 
        text: text.trim(),
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined
      })
    }
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-600 bg-green-100',
      sad: 'text-blue-600 bg-blue-100',
      angry: 'text-red-600 bg-red-100',
      fear: 'text-purple-600 bg-purple-100',
      surprise: 'text-yellow-600 bg-yellow-100',
      neutral: 'text-gray-600 bg-gray-100',
      joy: 'text-green-600 bg-green-100',
      anger: 'text-red-600 bg-red-100',
      sadness: 'text-blue-600 bg-blue-100',
      disgust: 'text-orange-600 bg-orange-100',
    }
    return colors[emotion.toLowerCase()] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link 
              to="/app" 
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Emotion Analysis
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Emotion Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Share your thoughts and let our AI analyze your emotional state
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling? Share your thoughts...
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I'm feeling a bit overwhelmed today. Work has been stressful and I'm having trouble sleeping..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Tags Selection */}
            {tags && tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add tags (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.tag_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={predictionMutation.isPending}
              disabled={!text.trim()}
              className="w-full sm:w-auto"
            >
              Analyze Emotion
              <Send className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Results
            </h3>
            
            {/* Input Text */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your Input:</h4>
              <p className="text-gray-900">"{result.input}"</p>
            </div>

            {/* Prediction Result */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Detected Emotion
              </h4>
              <div className="flex items-center justify-center">
                <span className={`px-6 py-3 rounded-full text-lg font-semibold ${getEmotionColor(result.prediction)}`}>
                  {result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {result.tags && result.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Applied Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span key={tag.id} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 mb-2">
                Recommendations
              </h4>
              <p className="text-blue-700 mb-3">
                Based on your emotional state, here are some suggestions:
              </p>
              <ul className="space-y-1 text-blue-700">
                <li>• Listen to calming music to help regulate your mood</li>
                <li>• Practice deep breathing exercises</li>
                <li>• Consider talking to someone you trust</li>
                <li>• Take a short walk or do light exercise</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setText('')
                  setResult(null)
                  setSelectedTags([])
                }}
                variant="outline"
              >
                Analyze Another Text
              </Button>
              <Link to="/app">
                <Button variant="ghost">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {predictionMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">
              Failed to analyze emotion. Please make sure you're logged in and try again.
            </p>
          </div>
        )}
      </main>
    </div>
  )
})

PredictionPageFixed.displayName = 'PredictionPageFixed'