// Auth types
export interface User {
  id: number
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// Prediction types
export interface PredictionRequest {
  text: string
}

export interface PredictionResponse {
  emotion: string
  confidence: number
  probabilities: Record<string, number>
}

// Music types
export interface Music {
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

export interface MusicResponse {
  items: Music[]
  total: number
  page: number
  size: number
}

// Tag types
export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

// Emotion Label types
export interface EmotionLabel {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}