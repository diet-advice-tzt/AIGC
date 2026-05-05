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
const { generateImage } = require('../utils/baidu')

router.post('/picture', authMiddleware, async (req, res) => {
  const { picture, userId, sessionId } = req.body
  if (!picture) {
    return res.json({ code: 0, msg: '请输入图片描述', data: null })
  }

  try {
    // 调用同步接口生成图片
    const imageUrl = await generateImage(picture)

    // 存储生成记录
    db.prepare(`
      INSERT INTO image_link (session_id, user_id, image_url, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))
    `).run(sessionId || '', Number(userId) || req.userId, imageUrl)

    return res.json({ 
      code: 1, 
      msg: 'success', 
      data: imageUrl,
      detail: {
        model: process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-2.0-pro',
        prompt: picture.slice(0, 50) + (picture.length > 50 ? '...' : ''),
      }
    })
  } catch (err) {
    console.error('[picture] generate error:', err.message)
    
    // 返回详细错误信息给前端
    const errorResponse = { 
      code: 0, 
      msg: err.message, 
      data: null,
      detail: {
        errorType: err.response?.status || 'unknown',
        statusCode: err.response?.status,
        rawError: err.response?.data ? JSON.stringify(err.response.data) : null,
        prompt: picture.slice(0, 50) + (picture.length > 50 ? '...' : ''),
      }
    }
    
    return res.json(errorResponse)
  }
})

module.exports = router
