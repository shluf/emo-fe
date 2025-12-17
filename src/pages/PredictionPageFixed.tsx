import { memo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Brain, Send, ArrowLeft, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useTranslation } from '../utils/translations'
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

interface BatchPredictionRequest {
  texts: string[]
  tag_ids?: number[]
}

interface BatchPredictionResponse {
  input: string
  prediction: string
}

interface Tag {
  id: number
  tag_name: string
  color: string
}

type InputMode = 'single' | 'batch' | 'csv'

export const PredictionPageFixed = memo(() => {
  const { t } = useTranslation()
  const [inputMode, setInputMode] = useState<InputMode>('single')
  const [text, setText] = useState('')
  const [batchTexts, setBatchTexts] = useState<string[]>([''])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [batchResults, setBatchResults] = useState<BatchPredictionResponse[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvColumn, setCsvColumn] = useState('text')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when input mode changes
  useEffect(() => {
    resetForm()
  }, [inputMode])

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

  const batchPredictionMutation = useMutation({
    mutationFn: async (data: BatchPredictionRequest) => {
      const response = await api.post<BatchPredictionResponse[]>('/predict/batch', data)
      return response.data
    },
    onSuccess: (data) => {
      setBatchResults(data)
    },
  })

  const csvPredictionMutation = useMutation({
    mutationFn: async (data: { file: File; text_column: string; tag_ids?: number[] }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('text_column', data.text_column)
      if (data.tag_ids && data.tag_ids.length > 0) {
        formData.append('tag_ids', data.tag_ids.join(','))
      }
      
      const response = await api.post('/predict/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      })
      
      // Download the CSV file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `predictions_${data.file.name}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return response.data
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputMode === 'single' && text.trim()) {
      predictionMutation.mutate({ 
        text: text.trim(),
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined
      })
    } else if (inputMode === 'batch') {
      const validTexts = batchTexts.filter(t => t.trim())
      if (validTexts.length > 0) {
        batchPredictionMutation.mutate({
          texts: validTexts,
          tag_ids: selectedTags.length > 0 ? selectedTags : undefined
        })
      }
    } else if (inputMode === 'csv' && csvFile && csvColumn.trim()) {
      csvPredictionMutation.mutate({
        file: csvFile,
        text_column: csvColumn.trim(),
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

  const addBatchText = () => {
    setBatchTexts(prev => [...prev, ''])
  }

  const removeBatchText = (index: number) => {
    setBatchTexts(prev => prev.filter((_, i) => i !== index))
  }

  const updateBatchText = (index: number, value: string) => {
    setBatchTexts(prev => prev.map((text, i) => i === index ? value : text))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
    }
  }

  const resetForm = () => {
    setText('')
    setBatchTexts([''])
    setCsvFile(null)
    setResult(null)
    setBatchResults([])
    setSelectedTags([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
      sad: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
      angry: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
      fear: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900',
      surprise: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
      neutral: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
      joy: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
      anger: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
      sadness: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
      disgust: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900',
    }
    return colors[emotion.toLowerCase()] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('emotionAnalysisTitle')}
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
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('emotionAnalysisTitle')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('shareThoughts')}
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('inputMode')}
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('singleText')}
            </button>
            <button
              type="button"
              onClick={() => setInputMode('batch')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('batchText')}
            </button>
            <button
              type="button"
              onClick={() => setInputMode('csv')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('csvUpload')}
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Single Text Input */}
            {inputMode === 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('howAreYouFeelingInput')}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>
            )}

            {/* Batch Text Input */}
            {inputMode === 'batch' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('batchTexts')}
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBatchText}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('addText')}
                  </Button>
                </div>
                <div className="space-y-3">
                  {batchTexts.map((batchText, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={batchText}
                        onChange={(e) => updateBatchText(index, e.target.value)}
                        placeholder={`${t('inputPlaceholder')} ${index + 1}`}
                        className="flex-1 h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                      {batchTexts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBatchText(index)}
                          className="self-start mt-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSV Upload */}
            {inputMode === 'csv' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('csvFile')}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('supportedCsvFormat')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('csvColumn')}
                  </label>
                  <input
                    type="text"
                    value={csvColumn}
                    onChange={(e) => setCsvColumn(e.target.value)}
                    placeholder={t('csvColumnPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('csvInstructions')}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {t('downloadResults')}
                  </p>
                </div>
              </div>
            )}

            {/* Tags Selection */}
            {tags && tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('addTags')}
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
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              loading={
                inputMode === 'single' ? predictionMutation.isPending :
                inputMode === 'batch' ? batchPredictionMutation.isPending :
                csvPredictionMutation.isPending
              }
              disabled={
                inputMode === 'single' ? !text.trim() :
                inputMode === 'batch' ? batchTexts.every(t => !t.trim()) :
                !csvFile || !csvColumn.trim()
              }
              className="w-full sm:w-auto"
            >
              {inputMode === 'csv' ? t('uploadCsv') : t('analyzeEmotion')}
              <Send className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Single Text Results */}
        {result && inputMode === 'single' && (
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('analysisResults')}
            </h3>
            
            {/* Input Text */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('yourInput')}</h4>
              <p className="text-gray-900 dark:text-white">"{result.input}"</p>
            </div>

            {/* Prediction Result */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                {t('detectedEmotion')}
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
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {t('appliedTags')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span key={tag.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
                {t('recommendations')}
              </h4>
              <p className="text-blue-700 dark:text-blue-300 mb-3">
                {t('basedOnEmotionalState')}
              </p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>{t('recommendation1')}</li>
                <li>{t('recommendation2')}</li>
                <li>{t('recommendation3')}</li>
                <li>{t('recommendation4')}</li>
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
                {t('analyzeAnotherText')}
              </Button>
              <Link to="/app">
                <Button variant="ghost">
                  {t('backToDashboard')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Batch Results */}
        {batchResults.length > 0 && inputMode === 'batch' && (
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('batchResults')} ({batchResults.length})
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {batchResults.map((batchResult, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Text {index + 1}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getEmotionColor(batchResult.prediction)}`}>
                      {batchResult.prediction}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    "{batchResult.input}"
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setBatchTexts([''])
                  setBatchResults([])
                  setSelectedTags([])
                }}
                variant="outline"
              >
                {t('analyzeAnotherText')}
              </Button>
              <Link to="/app">
                <Button variant="ghost">
                  {t('backToDashboard')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* CSV Success Message */}
        {csvPredictionMutation.isSuccess && inputMode === 'csv' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400">
              {t('csvProcessed')}
            </p>
          </div>
        )}

        {/* Error States */}
        {(predictionMutation.isError || batchPredictionMutation.isError || csvPredictionMutation.isError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400">
              {inputMode === 'csv' 
                ? t('csvError')
                : t('failedToAnalyze')
              }
            </p>
          </div>
        )}
      </main>
    </div>
  )
})

PredictionPageFixed.displayName = 'PredictionPageFixed'