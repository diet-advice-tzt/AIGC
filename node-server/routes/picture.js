/**
 * AI 图片生成路由
 *
 * POST /user/picture  使用百度 AI 作画（文生图）生成图片
 *   Body: { picture: string, userId: string, sessionId: string }
 *   返回: { code:1, data: "图片URL" }
 */
const express = require('express')
const router = express.Router()
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')
const { submitImageTask, pollImageResult } = require('../utils/baidu')

router.post('/picture', authMiddleware, async (req, res) => {
  const { picture, userId, sessionId } = req.body
  if (!picture) {
    return res.json({ code: 0, msg: '请输入图片描述', data: null })
  }

  try {
    // 第一步：提交作画任务
    const taskId = await submitImageTask(picture)

    // 第二步：轮询等待结果（最长 120s）
    const imageUrl = await pollImageResult(taskId)

    // 存储生成记录
    db.prepare(`
      INSERT INTO image_link (session_id, user_id, image_url, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))
    `).run(sessionId || '', Number(userId) || req.userId, imageUrl)

    return res.json({ code: 1, msg: 'success', data: imageUrl })
  } catch (err) {
    console.error('[picture] generate error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

module.exports = router
