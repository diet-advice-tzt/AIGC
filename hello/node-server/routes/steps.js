/**
 * 步数路由
 *
 * GET  /user/steps/daily?userId=xxx&date=yyyy-MM-dd  获取今日步数和排名
 * POST /user/steps/batch   上报步数并重新计算排名
 */
const express = require('express')
const router = express.Router()
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')
const { chatWithErnie } = require('../utils/baidu')

// GET /user/steps/daily
router.get('/steps/daily', authMiddleware, async (req, res) => {
  const userId = req.query.userId || req.userId
  const date = req.query.date || new Date().toISOString().slice(0, 10)

  try {
    const row = db
      .prepare('SELECT * FROM step_record WHERE user_id = ? AND step_date = ?')
      .get(Number(userId), date)

    if (!row) {
      return res.json({ code: 0, msg: '暂无今日步数数据', data: null })
    }

    // 如果没有 AI 评价则调用千帆生成一条（不阻塞，失败时忽略）
    let aiEvaluation = row.ai_evaluation
    if (!aiEvaluation) {
      try {
        aiEvaluation = await chatWithErnie(
          `根据我今天所走的步数:${row.steps}步，给出一段不超过二十字的建议`
        )
        // 存入数据库避免重复调用
        db.prepare("UPDATE step_record SET ai_evaluation = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(
          aiEvaluation,
          row.id
        )
      } catch {
        aiEvaluation = null
      }
    }

    return res.json({
      code: 1,
      msg: 'success',
      data: {
        date: row.step_date,
        steps: row.steps,
        rank: row.rank,
        aiEvaluation,
      },
    })
  } catch (err) {
    console.error('[steps] daily error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

// POST /user/steps/batch
router.post('/steps/batch', authMiddleware, (req, res) => {
  const { userId, stepDate, steps } = req.body
  if (!steps || steps <= 0) {
    return res.json({ code: 0, msg: '步数必须为正整数', data: null })
  }

  try {
    const date = stepDate || new Date().toISOString().slice(0, 10)
    const exist = db
      .prepare('SELECT id FROM step_record WHERE user_id = ? AND step_date = ?')
      .get(Number(userId) || req.userId, date)

    if (exist) {
      // 已有记录 → 更新
      db.prepare(
        "UPDATE step_record SET steps = ?, ai_evaluation = NULL, updated_at = datetime('now','localtime') WHERE user_id = ? AND step_date = ?"
      ).run(steps, Number(userId) || req.userId, date)
    } else {
      // 新增
      db.prepare(`
        INSERT INTO step_record (user_id, steps, step_date, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))
      `).run(Number(userId) || req.userId, steps, date)
    }

    // 重新计算今日所有用户步数排名
    const allSteps = db
      .prepare('SELECT id, steps FROM step_record WHERE step_date = ? ORDER BY steps DESC')
      .all(date)

    const updateRank = db.prepare('UPDATE step_record SET rank = ? WHERE id = ?')
    const updateMany = db.transaction((rows) => {
      rows.forEach((row, index) => {
        updateRank.run(index + 1, row.id)
      })
    })
    updateMany(allSteps)

    return res.json({ code: 1, msg: '步数上传成功', data: null })
  } catch (err) {
    console.error('[steps] batch error:', err.message)
    return res.json({ code: 0, msg: err.message, data: null })
  }
})

module.exports = router
