export const EMOTIONS = [
  'happy',
  'sad', 
  'angry',
  'fear',
  'surprise',
  'neutral',
  'calm',
  'excited',
  'anxious',
  'relaxed'
] as const

export const EMOTION_COLORS = {
  happy: 'text-green-600 bg-green-100',
  sad: 'text-blue-600 bg-blue-100', 
  angry: 'text-red-600 bg-red-100',
  fear: 'text-purple-600 bg-purple-100',
  surprise: 'text-yellow-600 bg-yellow-100',
  neutral: 'text-gray-600 bg-gray-100',
  calm: 'text-teal-600 bg-teal-100',
  excited: 'text-orange-600 bg-orange-100',
  anxious: 'text-pink-600 bg-pink-100',
  relaxed: 'text-indigo-600 bg-indigo-100'
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  USERS: '/users',
  PREDICT: '/predict/',
  MUSIC: '/music/',
  TAGS: '/tags/',
  EMOTION_LABELS: '/emotion-labels/'
} as const