/**
 * JWT 鉴权中间件
 * 前端在请求头 Authorization 中携带 token
 */
const jwt = require('jsonwebtoken')

module.exports = function authMiddleware(req, res, next) {
  const token = req.headers['authorization']
  if (!token) {
    return res.json({ code: 0, msg: '未登录，请先登录', data: null })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'race_jwt_secret_2026')
    req.userId = payload.userId
    next()
  } catch {
    return res.json({ code: 0, msg: 'token 已过期或无效，请重新登录', data: null })
  }
}
