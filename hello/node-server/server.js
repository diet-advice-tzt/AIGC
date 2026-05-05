/**
 * Race 运动竞赛系统 - Node.js 后端入口
 *
 * 功能模块：
 *   - REST API：认证 / AI 对话 / AI 作画 / 步数 / 轨迹 / 用户
 *   - WebSocket：ws://host/realtime/:userId  实时轨迹上报
 *   - 健康检查：GET /api/health
 *
 * 数据库：SQLite（better-sqlite3）
 * AI：百度千帆 ERNIE（对话）+ 百度 AI 作画（文生图）
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { WebSocketServer } = require('ws')
const url = require('url')

const db = require('./db/init')
const { chatWithErnie } = require('./utils/baidu')

// ─── Express 应用 ──────────────────────────────────────────────────────────
const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── 健康检查 ──────────────────────────────────────────────────────────────
// 健康检查：支持 /health 和 /api/health
app.get('/health', (req, res) => {
  res.json({ code: 1, msg: 'ok', data: { status: 'running', time: new Date().toISOString() } })
})
app.get('/api/health', (req, res) => {
  res.json({ code: 1, msg: 'ok', data: { status: 'running', time: new Date().toISOString() } })
})

// ─── 路由挂载 ─────────────────────────────────────────────────────────────
// 支持带 /api 前缀和不带前缀两种方式
const authRoutes = require('./routes/auth')
const chatRoutes = require('./routes/chat')
const pictureRoutes = require('./routes/picture')
const stepsRoutes = require('./routes/steps')
const trackRoutes = require('./routes/track')
const userRoutes = require('./routes/user')

app.use('/user', authRoutes)
app.use('/api/user', authRoutes)
app.use('/user', chatRoutes)
app.use('/api/user', chatRoutes)
app.use('/user', pictureRoutes)
app.use('/api/user', pictureRoutes)
app.use('/user', stepsRoutes)
app.use('/api/user', stepsRoutes)
app.use('/user', trackRoutes)
app.use('/api/user', trackRoutes)
app.use('/user', userRoutes)
app.use('/api/user', userRoutes)

// ─── WebSocket 服务：ws://host/realtime/:userId ────────────────────────────
const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

// userId → WebSocket 会话映射
const wsClients = new Map()

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname
  const match = pathname.match(/^\/realtime\/(.+)$/)
  if (match) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = match[1]
      wss.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
  }
})

wss.on('connection', (ws) => {
  const userId = ws.userId
  wsClients.set(userId, ws)
  console.log(`[WS] 客户端连接 userId=${userId}，在线: ${wsClients.size}`)

  ws.on('message', async (rawData) => {
    let payload
    try {
      payload = JSON.parse(rawData.toString())
    } catch {
      console.warn('[WS] 无效 JSON:', rawData.toString())
      return
    }

    const { userId: uid, latitude, longitude, recordTime } = payload
    if (!latitude || !longitude) return

    try {
      // 计算距离（从该用户最后一个轨迹点到当前点的距离，单位米）
      const lastTrack = db
        .prepare('SELECT latitude, longitude, total_distance FROM track_record WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
        .get(Number(uid) || Number(userId))

      let totalDistance = 0
      if (lastTrack) {
        const d = haversine(lastTrack.latitude, lastTrack.longitude, latitude, longitude)
        totalDistance = (lastTrack.total_distance || 0) + Math.round(d)
      }

      // 构建 trackId
      const trackId = `${latitude}${longitude}${recordTime || new Date().toISOString()}${uid || userId}`

      // 存储轨迹点
      db.prepare(`
        INSERT OR IGNORE INTO track_record (track_id, user_id, latitude, longitude, record_time, total_distance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
      `).run(trackId, Number(uid) || Number(userId), latitude, longitude, recordTime || new Date().toISOString(), totalDistance)

      // 调用千帆生成运动建议（使用较短超时）
      let remark = ''
      try {
        remark = await Promise.race([
          chatWithErnie(`这是我今天走路的距离，请根据这个距离帮我生成一段不超过二十个字的建议，距离为:${totalDistance}米`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ])
      } catch {
        remark = `已记录轨迹，累计${totalDistance}米，继续加油！`
      }

      // 回复客户端
      const response = JSON.stringify({
        trackId,
        status: 'success',
        recordTime: recordTime || new Date().toISOString(),
        remark,
        totalDistance,
      })

      if (ws.readyState === ws.OPEN) {
        ws.send(response)
      }
    } catch (err) {
      console.error('[WS] 处理轨迹消息失败:', err.message)
    }
  })

  ws.on('close', () => {
    wsClients.delete(userId)
    console.log(`[WS] 客户端断开 userId=${userId}，剩余: ${wsClients.size}`)
  })

  ws.on('error', (err) => {
    console.error(`[WS] 客户端错误 userId=${userId}:`, err.message)
    wsClients.delete(userId)
  })
})

/**
 * Haversine 公式计算两点球面距离（米）
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ─── 启动 ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`✅ Race 后端已启动：http://localhost:${PORT}`)
  console.log(`   健康检查：http://localhost:${PORT}/health`)
  console.log(`   WebSocket：ws://localhost:${PORT}/realtime/:userId`)
  console.log(`   数据库：${process.env.DB_PATH || './data/race.db'}`)
})
