import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageOutlined,
  PictureOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../store/userStore'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  {
    key: '/chat',
    icon: <MessageOutlined />,
    label: 'AI 对话',
  },
  {
    key: '/image',
    icon: <PictureOutlined />,
    label: 'AI 画图',
  },
  {
    key: '/steps',
    icon: <RiseOutlined />,
    label: '步数排名',
  },
  {
    key: '/track',
    icon: <EnvironmentOutlined />,
    label: '运动轨迹',
  },
  {
    key: '/profile',
    icon: <UserOutlined />,
    label: '个人中心',
  },
]

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    message.success('退出登录成功')
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
        }}>
          {collapsed ? '🏃' : '🏃‍♂️ Race 运动'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <h2 style={{ margin: 0 }}>运动竞赛系统</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout