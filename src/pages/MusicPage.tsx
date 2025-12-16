import { memo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Music, Play, Pause, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api from '@/lib/api'
import type { MusicResponse } from '@/types'

export const MusicPage = memo(() => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [currentPlaying, setCurrentPlaying] = useState<number | null>(null)

  const { data: musicData, isLoading, error } = useQuery({
    queryKey: ['music', searchTerm, selectedEmotion],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedEmotion) params.append('emotion', selectedEmotion)
      
      const response = await api.get<MusicResponse>(`/music/?${params}`)
      return response.data
    },
  })

  const emotions = ['happy', 'sad', 'calm', 'energetic', 'relaxed', 'focused']

  const handlePlay = (musicId: number) => {
    setCurrentPlaying(currentPlaying === musicId ? null : musicId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Music Therapy
        </h1>
        <p className="text-lg text-secondary-600">
          Discover music tailored to your emotional needs
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <Input
                placeholder="Search for songs, artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedEmotion === '' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedEmotion('')}
            >
              All
            </Button>
            {emotions.map((emotion) => (
              <Button
                key={emotion}
                variant={selectedEmotion === emotion ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedEmotion(emotion)}
              >
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Music List */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">Failed to load music. Please try again.</p>
          </div>
        ) : musicData?.items.length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No music found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {musicData?.items.map((music) => (
              <div key={music.id} className="p-6 hover:bg-secondary-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePlay(music.id)}
                      className="w-12 h-12 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      {currentPlaying === music.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-semibold text-secondary-900">
                        {music.title}
                      </h3>
                      <p className="text-secondary-600">{music.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                      {music.emotion}
                    </span>
                    <Button variant="outline" size="sm">
                      Add to Playlist
                    </Button>
                  </div>
                </div>
                
                {currentPlaying === music.id && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary-700">Now Playing</span>
                      <span className="text-sm text-primary-600">3:24 / 4:12</span>
                    </div>
                    <div className="w-full bg-primary-200 rounded-full h-1">
                      <div className="bg-primary-600 h-1 rounded-full w-3/4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {musicData && musicData.items.length > 0 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">1</Button>
            <Button size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      )}
    </div>
  )
})

MusicPage.displayName = 'MusicPage'