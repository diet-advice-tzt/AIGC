import React, { useState, useEffect } from 'react'
import { userApi } from '../api'
import { useUserStore } from '../store/userStore'

const Profile: React.FC = () => {
  const { user, setUser, token, logout } = useUserStore()
  const userId = user?.id ? Number(user.id) : 0
  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U'

  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 加载最新用户信息 POST /user/show/{id}
  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        const res: any = await userApi.show(userId)
        if (res.code === 1 && res.data) {
          const d = res.data
          setUsername(d.username ?? username)
          setEmail(d.email ?? '')
          setAvatarUrl(d.avatarImageUrl ?? '')
          // 同步 store
          setUser(
            {
              id: user?.id,
              username: d.username ?? user?.username,
              email: d.email,
              avatar: d.avatarImageUrl,
            },
            token!
          )
        }
      } catch { /* 忽略加载失败 */ }
    }
    load()
  }, [userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // POST /user/update  body: { userId, username, password, email, avatarImageUrl }
      const payload: any = { userId, username }
      if (email) payload.email = email
      if (password) payload.password = password
      if (avatarUrl) payload.avatarImageUrl = avatarUrl

      const res: any = await userApi.update(payload)
      if (res.code === 1) {
        setSuccess('信息已保存')
        setPassword('')
        // 同步 store 中的用户名
        setUser({ id: user?.id, username, email, avatar: avatarUrl }, token!)
      } else {
        setError(res.msg ?? '保存失败')
      }
    } catch (err: any) {
      setError(err?.msg ?? '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      {/* Avatar Block */}
      <div className="profile-avatar-block">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="profile-username">{user?.username}</div>
        {user?.email && <div className="profile-email">{user.email}</div>}
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '28px 28px 24px',
      }}>
        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="选填"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">头像 URL</label>
            <input
              className="form-input"
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="头像图片 URL（选填）"
              disabled={loading}
            />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <div className="form-group">
            <label className="form-label">新密码</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="不修改请留空"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#dc2626', padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontSize: 13, color: '#16a34a', padding: '8px 12px', background: '#f0fdf4', borderRadius: 6 }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            style={{ height: 44 }}
            disabled={loading}
          >
            {loading ? '保存中…' : '保存修改'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={() => logout()}
          style={{
            background: 'none', border: 'none', fontSize: 13,
            color: 'var(--text-mute)', cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

export default Profile
