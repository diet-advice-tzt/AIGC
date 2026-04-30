import axios from 'axios'
import { useUserStore } from '../store/userStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/user/login', data),
  register: (data: { username: string; password: string; email: string }) =>
    api.post('/user/register', data),
}

export const chatApi = {
  sendMessage: (data: { sessionId: string; content: string }) =>
    api.post('/user/chat', data),
  getHistory: (sessionId: string) => api.get(`/user/chat/history/${sessionId}`),
  getSessions: () => api.get('/user/sessions'),
}

export const imageApi = {
  generate: (data: { prompt: string }) => api.post('/user/image/generate', data),
  getHistory: () => api.get('/user/image/history'),
}

export const stepsApi = {
  getTodaySteps: () => api.get('/user/steps/today'),
  getRankings: () => api.get('/user/steps/rank'),
  updateSteps: (data: { steps: number }) => api.post('/user/steps/update', data),
}

export const trackApi = {
  getTracks: () => api.get('/user/track'),
  getTrackDetail: (trackId: string) => api.get(`/user/track/${trackId}`),
  getCities: () => api.get('/user/track/cities'),
  getRoutesByCity: (city: string) => api.get(`/user/track/routes/${city}`),
  createCustomTrack: (data: any) => api.post('/user/track/custom', data),
  searchPlace: (keyword: string) => api.get(`/user/place/search?keyword=${keyword}`),
}

export const checkBackendHealth = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  
  try {
    const result = await api.get('/health', {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export default api