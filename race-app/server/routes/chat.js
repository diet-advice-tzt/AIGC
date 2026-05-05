/**
 * AI 对话路由
 *
 * POST /user/questionSimple  发送问题，返回 AI 回复
 * GET  /user/queryRecord     查询用户所有对话历史
 * POST /user/newSpeak/:userId  新建会话
 */
const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')
const { chatWithErnie } = require('../utils/baidu')

// POST /user/questionSimple
router.post('/questionSimple', authMiddleware, async (req, res) => {
  const { question, userId, sessionId } = req.body
  if (!question) {
    return res.json({ code: 0, msg: '问题不能为空', data: null })
  }

  try {
    // 查询该 session 的历史消息，用于构建对话上下文（最近 10 条，保证 role 交替）
    const history = db
      .prepare(
        `SELECT content, thread_id FROM chat_record
         WHERE session_id = ? AND user_id = ?
         ORDER BY created_at DESC LIMIT 20`
      )
      .all(sessionId || '', userId || req.userId)
      .reverse()

    // thread_id = 'user' 表示用户消息，其余为 assistant
    const messages = history
      .map((r) => ({
        role: r.thread_id === 'user' ? 'user' : 'assistant',
        content: r.content,
      }))
      // 确保首条消息是 user（百度要求奇数条、首尾为 user）
      .filter((_, i, arr) => {
        if (arr.length === 0) return true
        if (i === 0) return arr[0].role === 'user'
        return arr[i].role !== arr[i - 1].role
      })

    const respond = await chatWithErnie(question, messages)

    // 存储用户问题
    db.prepare(`
      INSERT INTO chat_record (session_id, user_id, content, thread_id, created_at, updated_at)
      VALUES (?, ?, ?, 'user', datetime('now','localtime'), datetime('now','localtime'))
    `).run(sessionId || '', Number(userId) || req.userId, question)

    // 存储 AI 回复
    db.prepare(`
      INSERT INTO chat_record (session_id, user_id, content, thread_id, created_at, updated_at)
      VALUES (?, ?, ?, 'assistant', datetime('now','localtime'), datetime('now','localtime'))
    `).run(sessionId || '', Number(userId) || req.userId, respond)

    return res.json({
      code: 1,
      msg: 'success',
      data: { Respond: respond, success: '完美的返回' },
    })
  } catch (err) {
    console.error('[chat] questionSimple error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

// GET /user/queryRecord?userId=xxx
// 返回扁平消息数组，每条包含 content / role / createdAt
// 前端 Chat.tsx 第 55−63 行期望格式
router.get('/queryRecord', authMiddleware, (req, res) => {
  const userId = req.query.userId || req.userId
  try {
    // 查询该用户全部对话记录，按时间升序
    const chatRecords = db
      .prepare(
        `SELECT content, thread_id AS role, created_at AS createdAt, session_id AS sessionId
         FROM chat_record WHERE user_id = ?
         ORDER BY created_at ASC`
      )
      .all(Number(userId))

    return res.json({ code: 1, msg: 'success', data: chatRecords })
  } catch (err) {
    console.error('[chat] queryRecord error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

// POST /user/newSpeak/:userId
router.post('/newSpeak/:userId', authMiddleware, (req, res) => {
  const userId = req.params.userId
  try {
    const sessionId = uuidv4()
    db.prepare(`
      INSERT INTO session (user_id, session_key, created_at)
      VALUES (?, ?, datetime('now','localtime'))
    `).run(String(userId), sessionId)

    return res.json({
      code: 1,
      msg: 'success',
      data: { SessionId: sessionId, userId, success: 'true' },
    })
  } catch (err) {
    console.error('[chat] newSpeak error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

module.exports = router
