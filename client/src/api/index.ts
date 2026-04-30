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

// 认证：登录 POST /user/login、注册 POST /user/register
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/user/login', data),
  register: (data: { username: string; password: string }) =>
    api.post('/user/register', data),
}

// AI 对话：发问 POST /user/questionSimple、查历史 GET /user/queryRecord、新建会话 POST /user/newSpeak/{userId}
export const chatApi = {
  sendMessage: (data: { question: string; userId: string; sessionId: string }) =>
    api.post('/user/questionSimple', data),
  getHistory: (userId: number | string) =>
    api.get('/user/queryRecord', { params: { userId } }),
  newSession: (userId: number | string) =>
    api.post(`/user/newSpeak/${userId}`),
}

// 图片生成：POST /user/picture，body: { picture, userId, sessionId }，返回图片 URL 字符串
export const imageApi = {
  generate: (data: { picture: string; userId: string; sessionId: string }) =>
    api.post('/user/picture', data),
}

// 步数：获取今日步数+排名 GET /user/steps/daily、上报步数 POST /user/steps/batch
export const stepsApi = {
  getDailySteps: (userId: number | string, date: string) =>
    api.get('/user/steps/daily', { params: { userId, date } }),
  uploadSteps: (data: { userId: number; stepDate: string; steps: number }) =>
    api.post('/user/steps/batch', data),
}

// 轨迹：按 trackId 获取轨迹详情 GET /user/tracks/{trackId}
export const trackApi = {
  getTrack: (trackId: string) => api.get(`/user/tracks/${trackId}`),
}

// 用户信息：获取 POST /user/show/{id}、更新 POST /user/update
export const userApi = {
  show: (id: number | string) => api.post(`/user/show/${id}`),
  update: (data: {
    userId: number
    username?: string
    password?: string
    email?: string
    avatarImageUrl?: string
  }) => api.post('/user/update', data),
}

export const checkBackendHealth = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const result = await api.get('/health', { signal: controller.signal })
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export default api
