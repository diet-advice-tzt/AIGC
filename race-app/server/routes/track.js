/**
 * 轨迹路由
 *
 * GET /user/tracks/:trackId  按 trackId 查询历史轨迹
 *
 * WebSocket 部分在 server.js 中单独挂载：
 *   ws://host/realtime/:userId
 *   客户端发送: { userId, latitude, longitude, recordTime }
 *   服务端返回: { trackId, status, recordTime, remark }
 */
const express = require('express')
const router = express.Router()
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')

// GET /user/tracks/:trackId
router.get('/tracks/:trackId', authMiddleware, (req, res) => {
  const { trackId } = req.params
  try {
    const track = db
      .prepare('SELECT * FROM track_record WHERE track_id = ?')
      .get(trackId)

    if (!track) {
      return res.json({ code: 0, msg: '未找到该轨迹', data: null })
    }

    return res.json({
      code: 1,
      msg: 'success',
      data: {
        trackId: track.track_id,
        totalDistance: track.total_distance,
        points: [
          {
            latitude: track.latitude,
            longitude: track.longitude,
            time: track.record_time,
          },
        ],
      },
    })
  } catch (err) {
    console.error('[track] getTrack error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

module.exports = router
