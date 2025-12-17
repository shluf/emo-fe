import { memo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Music, 
  Play, 
  Pause, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  ArrowLeft,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useTranslation } from '../utils/translations'
import api from '../lib/api'

interface MusicItem {
  id: number
  title: string
  artist: string
  genre: string
  file_name: string
  file_path: string
  uploaded_by: number
  created_at: string
}

interface EmotionLabel {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

interface UploadFormData {
  title: string
  artist: string
  genre: string
  file: File | null
  emotionLabelIds: number[]
}

export const MusicPageFixed = memo(() => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [currentPlaying, setCurrentPlaying] = useState<number | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    title: '',
    artist: '',
    genre: '',
    file: null,
    emotionLabelIds: []
  })

  // Fetch music list
  const { data: musicList, isLoading, error } = useQuery({
    queryKey: ['music-list'],
    queryFn: async () => {
      const response = await api.get<MusicItem[]>('/music/')
      return response.data
    },
  })

  // Fetch emotion labels
  const { data: emotionLabels } = useQuery({
    queryKey: ['emotion-labels'],
    queryFn: async () => {
      const response = await api.get<EmotionLabel[]>('/emotion-labels/')
      return response.data
    },
  })

  // Upload music mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/music/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-list'] })
      queryClient.invalidateQueries({ queryKey: ['mood-music'] })
      setShowUploadForm(false)
      setUploadForm({ title: '', artist: '', genre: '', file: null, emotionLabelIds: [] })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  // Delete music mutation
  const deleteMutation = useMutation({
    mutationFn: async (musicId: number) => {
      await api.delete(`/music/${musicId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-list'] })
      if (currentPlaying) {
        setCurrentPlaying(null)
        setIsPlaying(false)
      }
    },
  })

  // Filter music based on search and genre
  const filteredMusic = musicList?.filter(music => {
    const matchesSearch = music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         music.artist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === '' || music.genre === selectedGenre
    return matchesSearch && matchesGenre
  }) || []

  // Get unique genres
  const genres = [...new Set(musicList?.map(music => music.genre).filter(Boolean) || [])]

  const handlePlay = async (musicId: number) => {
    if (currentPlaying === musicId && isPlaying) {
      // Pause current music
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    } else {
      // Play new music
      try {
        if (audioRef.current) {
          audioRef.current.src = `${api.defaults.baseURL}/music/${musicId}/download`
          audioRef.current.volume = volume
          audioRef.current.muted = isMuted
          await audioRef.current.play()
          setCurrentPlaying(musicId)
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Error playing music:', error)
      }
    }
  }



  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleDownload = (musicId: number) => {
    window.open(`${api.defaults.baseURL}/music/${musicId}/download`, '_blank')
  }

  const handleDelete = (musicId: number) => {
    if (window.confirm(t('confirmDelete'))) {
      deleteMutation.mutate(musicId)
    }
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.title) return

    const formData = new FormData()
    formData.append('title', uploadForm.title)
    formData.append('artist', uploadForm.artist)
    formData.append('genre', uploadForm.genre)
    formData.append('file', uploadForm.file)
    
    // Add emotion label IDs as comma-separated string
    if (uploadForm.emotionLabelIds.length > 0) {
      formData.append('emotion_label_ids', uploadForm.emotionLabelIds.join(','))
    }

    uploadMutation.mutate(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setUploadForm(prev => ({ ...prev, file }))
  }

  const toggleEmotionLabel = (labelId: number) => {
    setUploadForm(prev => ({
      ...prev,
      emotionLabelIds: prev.emotionLabelIds.includes(labelId)
        ? prev.emotionLabelIds.filter(id => id !== labelId)
        : [...prev.emotionLabelIds, labelId]
    }))
  }

  const getEmotionLabelColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'happy': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'sad': 'bg-blue-100 text-blue-800 border-blue-300',
      'angry': 'bg-red-100 text-red-800 border-red-300',
      'fear': 'bg-purple-100 text-purple-800 border-purple-300',
      'surprise': 'bg-green-100 text-green-800 border-green-300',
      'disgust': 'bg-orange-100 text-orange-800 border-orange-300',
      'neutral': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colorMap[color.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300'
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
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('musicTherapy')}
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
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('musicTherapy')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('discoverMusic')}
          </p>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('uploadMusic')}
          </Button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('uploadNewMusic')}
            </h3>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('musicTitle')}
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <Input
                  label={t('artist')}
                  value={uploadForm.artist}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, artist: e.target.value }))}
                />
              </div>
              <Input
                label={t('genre')}
                value={uploadForm.genre}
                onChange={(e) => setUploadForm(prev => ({ ...prev, genre: e.target.value }))}
              />
              
              {/* Emotion Labels Selection */}
              {emotionLabels && emotionLabels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('emotionLabels')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {emotionLabels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleEmotionLabel(label.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          uploadForm.emotionLabelIds.includes(label.id)
                            ? `${getEmotionLabelColor(label.name)} border-current`
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {label.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('selectEmotionLabelsHelp')}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('musicFile')}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.flac,.m4a,.ogg"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('supportedFormats')}: MP3, WAV, FLAC, M4A, OGG
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  loading={uploadMutation.isPending}
                  disabled={!uploadForm.file || !uploadForm.title}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('uploadMusic')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('searchMusic')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedGenre === '' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedGenre('')}
              >
                {t('allGenres')}
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Music Player Controls */}
        {currentPlaying && (
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t('volume')}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {t('nowPlaying')}: {musicList?.find(m => m.id === currentPlaying)?.title}
              </div>
            </div>
          </div>
        )}

        {/* Music List */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
          {isLoading ? (
            <div className="p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{t('failedToLoadMusic')}</p>
            </div>
          ) : filteredMusic.length === 0 ? (
            <div className="p-12 text-center">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm || selectedGenre ? t('noMusicFound') : t('noMusicAvailable')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMusic.map((music) => (
                <div key={music.id} className="p-6 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handlePlay(music.id)}
                        className="w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {currentPlaying === music.id && isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {music.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">{music.artist}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(music.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-wrap gap-1">
                        {music.genre && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm rounded-full">
                            {music.genre}
                          </span>
                        )}
                        {(music as any).emotion_labels?.map((label: EmotionLabel) => (
                          <span
                            key={label.id}
                            className={`px-2 py-1 text-xs rounded-full border ${getEmotionLabelColor(label.name)}`}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(music.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t('download')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(music.id)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentPlaying(null)
        }}
        onError={() => {
          setIsPlaying(false)
          setCurrentPlaying(null)
        }}
      />
    </div>
  )
})

MusicPageFixed.displayName = 'MusicPageFixed'