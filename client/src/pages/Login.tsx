import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, checkBackendHealth } from '../api'
import { useUserStore } from '../store/userStore'

type Tab = 'login' | 'register'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useUserStore()

  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  // form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      try {
        await checkBackendHealth()
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      }
    }
    check()
    const t = setInterval(check, 5000)
    return () => clearInterval(t)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res: any = await authApi.login({ username, password })
      if (res.code === 1) {
        setUser(res.data, res.data.token)
        navigate('/chat')
      } else {
        setError(res.msg || '登录失败，请检查用户名或密码')
      }
    } catch (err: any) {
      setError(err?.msg || err?.message || '网络错误，请检查后端是否启动')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    if (password !== confirmPwd) {
      setError('两次密码不一致')
      return
    }
    setLoading(true)
    try {
      const res: any = await authApi.register({ username, password })
      if (res.code === 1) {
        setTab('login')
        setPassword('')
        setConfirmPwd('')
        setError('')
      } else {
        setError(res.msg || '注册失败')
      }
    } catch (err: any) {
      setError(err?.msg || err?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setError('')
    setPassword('')
    setConfirmPwd('')
  }

  const statusEl = (() => {
    if (backendOnline === null) return (
      <div className="backend-status checking">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', marginRight: 2 }} />
        正在检测后端连接…
      </div>
    )
    if (backendOnline) return (
      <div className="backend-status online">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginRight: 6 }} />
        后端服务已连接（端口 8080）
      </div>
    )
    return (
      <div className="backend-status offline">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block', marginRight: 6 }} />
        后端未启动 — 请启动 ServerApplication.java
      </div>
    )
  })()

  return (
    <div className="login-page">
      {/* Left */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">R</div>
          <h1>Race 运动竞赛</h1>
          <p>记录每一步，AI 陪你突破自己</p>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">💬</div>
            <div className="login-feature-text">
              <h4>AI 智能对话</h4>
              <p>随时获取个性化运动建议</p>
            </div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">👟</div>
            <div className="login-feature-text">
              <h4>步数排行榜</h4>
              <p>与好友比拼，燃起运动热情</p>
            </div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">🗺️</div>
            <div className="login-feature-text">
              <h4>实时轨迹记录</h4>
              <p>WebSocket 实时追踪，AI 点评你的路线</p>
            </div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">🎨</div>
            <div className="login-feature-text">
              <h4>AI 图片生成</h4>
              <p>描述运动场景，AI 为你作画</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="login-right">
        <div className="login-form-box">
          <div className="login-form-title">
            {tab === 'login' ? '欢迎回来' : '创建账号'}
          </div>
          <div className="login-form-sub">
            {tab === 'login' ? '登录以继续使用 Race 运动竞赛系统' : '注册后立即开始你的运动之旅'}
          </div>

          {statusEl}

          <div className="login-tab-bar">
            <div className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>登录</div>
            <div className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>注册</div>
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            <div className="login-field">
              <label>用户名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label>密码</label>
              <input
                className="form-input"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                disabled={loading}
              />
            </div>

            {tab === 'register' && (
              <div className="login-field">
                <label>确认密码</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? '请稍候…' : (tab === 'login' ? '登录' : '注册')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
