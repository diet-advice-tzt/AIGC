export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  token: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
  sessionId: string
}

export interface Session {
  id: string
  name: string
  createdAt: string
  userId: string
}

export interface ImageItem {
  id: string
  imageUrl: string
  prompt: string
  createdAt: string
  sessionId: string
}

export interface DailySteps {
  userId: string
  username: string
  steps: number
  stepDate: string
  rank: number
  aiEvaluation?: string
}

export interface TrackPoint {
  trackId: string
  latitude: number
  longitude: number
  recordTime: string
  totalDistance: number
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}