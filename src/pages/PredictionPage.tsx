import { memo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Brain, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import type { PredictionRequest, PredictionResponse } from '@/types'

export const PredictionPage = memo(() => {
  const [text, setText] = useState('')
  const [result, setResult] = useState<PredictionResponse | null>(null)

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
      predictionMutation.mutate({ text: text.trim() })
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-600 bg-green-100',
      sad: 'text-blue-600 bg-blue-100',
      angry: 'text-red-600 bg-red-100',
      fear: 'text-purple-600 bg-purple-100',
      surprise: 'text-yellow-600 bg-yellow-100',
      neutral: 'text-gray-600 bg-gray-100',
    }
    return colors[emotion.toLowerCase()] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Emotion Analysis
        </h1>
        <p className="text-lg text-secondary-600">
          Share your thoughts and let our AI analyze your emotional state
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              How are you feeling? Share your thoughts...
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I'm feeling a bit overwhelmed today. Work has been stressful and I'm having trouble sleeping..."
              className="w-full h-32 px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              required
            />
          </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">
            Analysis Results
          </h3>
          
          {/* Primary Emotion */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-secondary-600">
                Detected Emotion
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(result.emotion)}`}>
                {result.emotion}
              </span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <p className="text-sm text-secondary-600 mt-1">
              {result.confidence}% confidence
            </p>
          </div>

          {/* All Probabilities */}
          <div>
            <h4 className="text-lg font-medium text-secondary-900 mb-3">
              Emotion Breakdown
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.probabilities).map(([emotion, probability]) => (
                <div key={emotion} className="text-center p-3 bg-secondary-50 rounded-lg">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${getEmotionColor(emotion)}`}>
                    {emotion}
                  </div>
                  <p className="text-lg font-semibold text-secondary-900">
                    {(probability * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <h4 className="text-lg font-medium text-primary-900 mb-2">
              Recommendations
            </h4>
            <p className="text-primary-700 mb-3">
              Based on your emotional state, here are some suggestions:
            </p>
            <ul className="space-y-1 text-primary-700">
              <li>• Listen to calming music to help regulate your mood</li>
              <li>• Practice deep breathing exercises</li>
              <li>• Consider talking to someone you trust</li>
              <li>• Take a short walk or do light exercise</li>
            </ul>
          </div>
        </div>
      )}

      {/* Error State */}
      {predictionMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Failed to analyze emotion. Please try again.
          </p>
        </div>
      )}
    </div>
  )
})

PredictionPage.displayName = 'PredictionPage'