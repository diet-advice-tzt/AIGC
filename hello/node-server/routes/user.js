/**
 * 用户信息路由
 *
 * POST /user/show/:id   获取用户信息
 * POST /user/update     修改用户信息
 * GET  /user/delete/:id 删除用户
 */
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')
const { submitImageTask, pollImageResult } = require('../utils/baidu')

// 每日天气图片缓存（key: userId, val: { url, date }）
const weatherCache = {}

// POST /user/show/:id
router.post('/show/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  try {
    const user = db.prepare('SELECT * FROM user WHERE id = ?').get(Number(id))
    if (!user) {
      return res.json({ code: 0, msg: '用户不存在', data: null })
    }

    // 天气图片：每天生成一次，缓存在内存中
    let weatherImageUrl = user.weather_image_url
    const today = new Date().toISOString().slice(0, 10)
    const cached = weatherCache[id]

    if (!cached || cached.date !== today) {
      try {
        const taskId = await submitImageTask('晴天户外运动风景，阳光明媚，清新自然，写实风格')
        weatherImageUrl = await pollImageResult(taskId)
        weatherCache[id] = { url: weatherImageUrl, date: today }
        // 同步更新数据库
        db.prepare("UPDATE user SET weather_image_url = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(
          weatherImageUrl,
          Number(id)
        )
      } catch {
        // 生成失败时使用已有值
        weatherImageUrl = user.weather_image_url || null
      }
    } else {
      weatherImageUrl = cached.url
    }

    return res.json({
      code: 1,
      msg: 'success',
      data: {
        username: user.username,
        email: user.email || '',
        imageUrl: user.avatar_image_url || '',
        password: user.password,
        weatherImageUrl,
        avatarImageUrl: user.avatar_image_url || '',
      },
    })
  } catch (err) {
    console.error('[user] show error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

// POST /user/update
router.post('/update', authMiddleware, (req, res) => {
  const { userId, username, password, email, avatarImageUrl } = req.body
  try {
    const sets = []
    const vals = []

    if (username !== undefined) { sets.push('username = ?'); vals.push(username) }
    if (email !== undefined) { sets.push('email = ?'); vals.push(email) }
    if (avatarImageUrl !== undefined) { sets.push('avatar_image_url = ?'); vals.push(avatarImageUrl) }
    if (password) {
      const hashed = bcrypt.hashSync(password, 10)
      sets.push('password = ?')
      vals.push(hashed)
    }
    sets.push("updated_at = datetime('now','localtime')")
    vals.push(Number(userId) || req.userId)

    db.prepare(`UPDATE user SET ${sets.join(', ')} WHERE id = ?`).run(...vals)

    return res.json({ code: 1, msg: '修改成功', data: null })
  } catch (err) {
    console.error('[user] update error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

// GET /user/delete/:id
router.get('/delete/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  try {
    db.prepare('DELETE FROM user WHERE id = ?').run(Number(id))
    return res.json({ code: 1, msg: '删除成功', data: null })
  } catch (err) {
    console.error('[user] delete error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

module.exports = router
