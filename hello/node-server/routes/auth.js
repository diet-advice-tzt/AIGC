/**
 * 认证路由：登录 / 注册
 * POST /user/login
 * POST /user/register
 */
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')

const JWT_SECRET = process.env.JWT_SECRET || 'race_jwt_secret_2026'
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '7200', 10)

// POST /user/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.json({ code: 0, msg: '用户名和密码不能为空', data: null })
  }

  const user = db.prepare('SELECT * FROM user WHERE username = ?').get(username)
  if (!user) {
    return res.json({ code: 0, msg: '用户不存在，请先注册', data: null })
  }

  // 支持明文密码（兼容旧数据）和 bcrypt 加密密码
  const passwordMatch =
    user.password === password ||
    bcrypt.compareSync(password, user.password)

  if (!passwordMatch) {
    return res.json({ code: 0, msg: '密码错误', data: null })
  }

  // 创建 session
  const sessionId = uuidv4()
  db.prepare('INSERT INTO session (user_id, session_key) VALUES (?, ?)').run(
    String(user.id),
    sessionId
  )

  // 签发 JWT
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })

  // 更新最后登录时间
  db.prepare("UPDATE user SET login_time = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?").run(user.id)

  return res.json({
    code: 1,
    msg: '登录成功',
    data: {
      id: String(user.id),       // 前端 userStore 定义 id 为 string
      username: user.username,
      name: user.username,
      email: user.email || '',
      token,
      sessionId,
    },
  })
})

// POST /user/register
router.post('/register', (req, res) => {
  const { username, password, email } = req.body
  if (!username || !password) {
    return res.json({ code: 0, msg: '用户名和密码不能为空', data: null })
  }

  const exist = db.prepare('SELECT id FROM user WHERE username = ?').get(username)
  if (exist) {
    return res.json({ code: 0, msg: '用户名已存在，请直接登录', data: null })
  }

  const hashed = bcrypt.hashSync(password, 10)
  db.prepare(`
    INSERT INTO user (username, password, email, count, created_at, updated_at)
    VALUES (?, ?, ?, 0, datetime('now','localtime'), datetime('now','localtime'))
  `).run(username, hashed, email || null)

  return res.json({ code: 1, msg: '注册成功，请重新登录', data: null })
})

module.exports = router
