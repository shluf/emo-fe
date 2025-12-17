import { memo, useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Minimize2,
  Maximize2,
  Music,
  X
} from 'lucide-react'
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

interface MusicPlayerOverlayProps {
  currentTrack: MusicItem | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export const MusicPlayerOverlay = memo<MusicPlayerOverlayProps>(({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onClose,
  isMinimized,
  onToggleMinimize
}) => {
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Update audio element when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = `${api.defaults.baseURL}/music/${currentTrack.id}/download`
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [currentTrack, volume, isMuted])

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
  }, [])

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

  if (!currentTrack) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700 shadow-lg z-50 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-32'
    }`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
        {/* Track Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevious}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <SkipBack className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={onNext}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Progress Bar (only when not minimized) */}
        {!isMinimized && (
          <div className="flex-1 mx-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* Volume Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          {!isMinimized && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onToggleMinimize}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={onNext}
        onError={() => {
          console.error('Audio playback error')
        }}
      />
    </div>
  )
})

MusicPlayerOverlay.displayName = 'MusicPlayerOverlay'