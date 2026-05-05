import axios from 'axios'
import { useUserStore } from '../store/userStore'

const api = axios.create({
  baseURL: 'http://8.141.102.173',
  timeout: 30000,
})

// 调试日志
console.log('[API] BaseURL:', import.meta.env.VITE_API_BASE_URL || '/api')

api.interceptors.request.use(
  (config) => {
    console.log('[API] Request:', config.url)
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.data)
    return response.data
  },
  (error) => {
    console.error('[API] Error:', error.response?.data || error)
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// 认证：登录 POST /api/user/login、注册 POST /api/user/register
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/user/login', data),
  register: (data: { username: string; password: string }) =>
    api.post('/api/user/register', data),
}

// AI 对话：发问 POST /api/user/questionSimple、查历史 GET /api/user/queryRecord、新建会话 POST /api/user/newSpeak/{userId}
export const chatApi = {
  sendMessage: (data: { question: string; userId: string; sessionId: string }) =>
    api.post('/api/user/questionSimple', data),
  getHistory: (userId: number | string) =>
    api.get('/api/user/queryRecord', { params: { userId } }),
  newSession: (userId: number | string) =>
    api.post(`/api/user/newSpeak/${userId}`),
}

// 图片生成：POST /api/user/picture，body: { picture, userId, sessionId }，返回图片 URL 字符串
// 图像生成可能需要较长时间，设置更长的超时时间（5分钟）
export const imageApi = {
  generate: (data: { picture: string; userId: string; sessionId: string }) =>
    api.post('/api/user/picture', data, { timeout: 300000 }), // 5分钟超时
}

// 步数：获取今日步数+排名 GET /api/user/steps/daily、上报步数 POST /api/user/steps/batch
export const stepsApi = {
  getDailySteps: (userId: number | string, date: string) =>
    api.get('/api/user/steps/daily', { params: { userId, date } }),
  uploadSteps: (data: { userId: number; stepDate: string; steps: number }) =>
    api.post('/api/user/steps/batch', data),
}

// 轨迹：按 trackId 获取轨迹详情 GET /api/user/tracks/{trackId}
export const trackApi = {
  getTrack: (trackId: string) => api.get(`/api/user/tracks/${trackId}`),
}

// 用户信息：获取 POST /api/user/show/{id}、更新 POST /api/user/update
export const userApi = {
  show: (id: number | string) => api.post(`/api/user/show/${id}`),
  update: (data: {
    userId: number
    username?: string
    password?: string
    email?: string
    avatarImageUrl?: string
  }) => api.post('/api/user/update', data),
}

export const checkBackendHealth = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const result = await api.get('/api/health', { signal: controller.signal })
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export default api
