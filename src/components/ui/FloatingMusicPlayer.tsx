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
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { useTranslation } from '../../utils/translations'
import api from '../../lib/api'

interface EmotionLabel {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

interface MusicItem {
  id: number
  title: string
  artist: string
  genre: string
  file_name: string
  file_path: string
  uploaded_by: number
  created_at: string
  emotion_labels?: EmotionLabel[]
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

  // Fetch music based on mood using emotion labels
  const { data: musicList } = useQuery({
    queryKey: ['mood-music', todaysMood],
    queryFn: async () => {
      const response = await api.get<MusicItem[]>('/music/')
      const allMusic = response.data
      
      if (!todaysMood || todaysMood === 'neutral') {
        return allMusic
      }
      
      // First, try to find music with matching emotion labels
      const musicWithEmotionLabels = allMusic.filter(music => 
        music.emotion_labels?.some(label => 
          label.name.toLowerCase() === todaysMood.toLowerCase()
        )
      )
      
      if (musicWithEmotionLabels.length > 0) {
        return musicWithEmotionLabels
      }
      
      // Fallback to genre-based filtering if no emotion labels match
      const moodGenreMap: Record<string, string[]> = {
        happy: ['pop', 'upbeat', 'energetic', 'dance', 'cheerful'],
        sad: ['ballad', 'slow', 'melancholy', 'acoustic', 'blues'],
        angry: ['rock', 'metal', 'intense', 'aggressive', 'punk'],
        fear: ['ambient', 'calm', 'soothing', 'peaceful', 'meditation'],
        surprise: ['electronic', 'experimental', 'unique', 'jazz'],
        disgust: ['alternative', 'indie', 'different', 'grunge'],
        neutral: ['chill', 'lounge', 'background', 'easy listening', 'instrumental']
      }
      
      const moodGenres = moodGenreMap[todaysMood] || []
      
      const genreFilteredMusic = allMusic.filter(music => 
        moodGenres.some(genre => 
          music.genre?.toLowerCase().includes(genre.toLowerCase())
        )
      )
      
      return genreFilteredMusic.length > 0 ? genreFilteredMusic : allMusic
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

  // Handle time updates and sync progress bar
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }
    
    const updateDuration = () => {
      setDuration(audio.duration || 0)
    }

    const handleLoadedData = () => {
      setDuration(audio.duration || 0)
    }

    const handleCanPlay = () => {
      setDuration(audio.duration || 0)
    }

    // Add multiple event listeners for better synchronization
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('durationchange', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('durationchange', updateDuration)
    }
  }, [currentTrack])

  // Additional effect to ensure progress bar updates during playback
  useEffect(() => {
    let intervalId: number | null = null
    
    if (isPlaying && audioRef.current) {
      intervalId = window.setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }, 100) // Update every 100ms for smooth progress
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [isPlaying])

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
    if (audioRef.current && !isNaN(newTime) && isFinite(newTime)) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || !isFinite(time)) return '0:00'
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
    <>
      <style>{`
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .volume-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .volume-slider {
          background: linear-gradient(to right, #3b82f6 0%, #3b82f6 var(--volume-percent, 70%), #e5e7eb var(--volume-percent, 70%), #e5e7eb 100%);
        }
      `}</style>
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-52'
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
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Track Info */}
            <div className="mb-4 text-center">
              <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                {currentTrack.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {currentTrack.artist}
              </p>
              {/* <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {currentTrack.genre}
              </p> */}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-10 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1 relative">
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-100 ease-out"
                      style={{ 
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime || 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="w-10 text-left">{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}

        {/* Controls */}
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3">
            {!isMinimized && (
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <SkipBack className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className={`${isMinimized ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r ${getMoodColor(todaysMood || 'neutral')} rounded-full flex items-center justify-center text-white transition-all hover:scale-105 shadow-lg`}
            >
              {isPlaying ? (
                <Pause className={`${isMinimized ? 'w-4 h-4' : 'w-6 h-6'}`} />
              ) : (
                <Play className={`${isMinimized ? 'w-4 h-4 ml-0.5' : 'w-6 h-6 ml-0.5'}`} />
              )}
            </button>
            
            {!isMinimized && (
              <button
                onClick={handleNext}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
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
                className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
                style={{
                  '--volume-percent': `${volume * 100}%`
                } as React.CSSProperties}
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
    </>
  )
})

FloatingMusicPlayer.displayName = 'FloatingMusicPlayer'