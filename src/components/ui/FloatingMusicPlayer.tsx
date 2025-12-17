import { memo, useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { useTranslation } from '../../utils/translations'
import api from '../../lib/api'

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

interface PredictionHistory {
  id: number
  input_text: string
  prediction: string
  created_at: string
  tags: Array<{ id: number; tag_name: string }>
}

interface FloatingMusicPlayerProps {
  isVisible: boolean
  onClose: () => void
}

export const FloatingMusicPlayer = memo<FloatingMusicPlayerProps>(({
  isVisible,
  onClose
}) => {
  const { t } = useTranslation()
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Get today's mood to determine music selection
  const { data: todaysMood } = useQuery({
    queryKey: ['todays-mood'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get<PredictionHistory[]>(`/predict/history?date_start=${today}&date_end=${today}`)
      const todaysAnalyses = response.data
      
      if (todaysAnalyses.length === 0) return 'neutral'
      
      // Get the most recent mood of today
      const latestMood = todaysAnalyses[todaysAnalyses.length - 1]
      return latestMood.prediction.toLowerCase()
    },
  })

  // Fetch music based on mood
  const { data: musicList } = useQuery({
    queryKey: ['mood-music', todaysMood],
    queryFn: async () => {
      const response = await api.get<MusicItem[]>('/music/')
      const allMusic = response.data
      
      // Filter music based on mood (you can enhance this logic)
      const moodMusicMap: Record<string, string[]> = {
        happy: ['pop', 'upbeat', 'energetic', 'dance'],
        sad: ['ballad', 'slow', 'melancholy', 'acoustic'],
        angry: ['rock', 'metal', 'intense', 'aggressive'],
        fear: ['ambient', 'calm', 'soothing', 'peaceful'],
        surprise: ['electronic', 'experimental', 'unique'],
        disgust: ['alternative', 'indie', 'different'],
        neutral: ['chill', 'lounge', 'background', 'easy listening']
      }
      
      const moodGenres = moodMusicMap[todaysMood || 'neutral'] || []
      
      // Filter music by genre matching mood, fallback to all music
      const filteredMusic = allMusic.filter(music => 
        moodGenres.some(genre => 
          music.genre?.toLowerCase().includes(genre.toLowerCase())
        )
      )
      
      return filteredMusic.length > 0 ? filteredMusic : allMusic
    },
    enabled: !!todaysMood,
  })

  const currentTrack = musicList?.[currentTrackIndex] || null

  // Auto-start playing when music player becomes visible and has tracks
  useEffect(() => {
    if (isVisible && currentTrack && !isPlaying && audioRef.current) {
      handlePlay()
    }
  }, [isVisible, currentTrack])

  // Update audio element when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = `${api.defaults.baseURL}/music/${currentTrack.id}/download`
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
      
      // Auto-play if was playing before
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error auto-playing music:', error)
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrack, volume, isMuted, isPlaying])

  // Handle time updates
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [currentTrack])

  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing music:', error)
      }
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (!musicList || musicList.length === 0) return
    const nextIndex = (currentTrackIndex + 1) % musicList.length
    setCurrentTrackIndex(nextIndex)
    // Keep playing state - will auto-play in useEffect
  }

  const handlePrevious = () => {
    if (!musicList || musicList.length === 0) return
    const prevIndex = currentTrackIndex === 0 ? musicList.length - 1 : currentTrackIndex - 1
    setCurrentTrackIndex(prevIndex)
    // Keep playing state - will auto-play in useEffect
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: 'from-yellow-500 to-orange-500',
      sad: 'from-blue-500 to-indigo-500',
      angry: 'from-red-500 to-pink-500',
      fear: 'from-purple-500 to-violet-500',
      surprise: 'from-green-500 to-teal-500',
      disgust: 'from-orange-500 to-red-500',
      neutral: 'from-gray-500 to-slate-500'
    }
    return colors[mood] || colors.neutral
  }

  if (!isVisible || !currentTrack) return null

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-48'
    }`}>
      {/* Mood indicator gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getMoodColor(todaysMood || 'neutral')} rounded-t-xl`} />
      
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-r ${getMoodColor(todaysMood || 'neutral')} rounded-full flex items-center justify-center`}>
              <Music className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('moodMusic')} - {todaysMood || t('neutral')}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Track Info */}
            <div className="mb-3">
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {currentTrack.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {currentTrack.artist}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-8">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-8">{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <SkipBack className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className={`w-8 h-8 bg-gradient-to-r ${getMoodColor(todaysMood || 'neutral')} rounded-full flex items-center justify-center text-white transition-colors`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <SkipForward className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {!isMinimized && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleNext}
        onError={() => {
          console.error('Audio playback error')
          setIsPlaying(false)
        }}
      />
    </div>
  )
})

FloatingMusicPlayer.displayName = 'FloatingMusicPlayer'