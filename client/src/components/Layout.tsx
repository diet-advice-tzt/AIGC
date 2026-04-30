import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/userStore'

const navItems = [
  { path: '/chat',    icon: '💬', label: 'AI 对话' },
  { path: '/image',   icon: '🎨', label: 'AI 画图' },
  { path: '/steps',   icon: '👟', label: '步数排名' },
  { path: '/track',   icon: '🗺️',  label: '运动轨迹' },
  { path: '/profile', icon: '👤', label: '个人中心' },
]

const pageTitles: Record<string, string> = {
  '/chat':    'AI 对话',
  '/image':   'AI 画图',
  '/steps':   '步数排名',
  '/track':   '运动轨迹',
  '/profile': '个人中心',
}

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U'

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">R</div>
            <span className="sidebar-logo-text">Race 运动</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-area" onClick={handleLogout} title="点击退出登录">
            <div className="user-avatar">{initial}</div>
            <div className="user-info">
              <div className="user-name">{user?.username ?? '用户'}</div>
              <div className="user-role">点击退出登录</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="app-main">
        <header className="app-header">
          <span className="page-title">{pageTitles[location.pathname] ?? ''}</span>
        </header>

        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
