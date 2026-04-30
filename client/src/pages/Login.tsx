import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Tabs, message, Alert, Spin } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi, checkBackendHealth } from '../api'
import { useUserStore } from '../store/userStore'
import type { TabsProps } from 'antd'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)
  const [form] = Form.useForm()

  useEffect(() => {
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkBackend = async () => {
    try {
      await checkBackendHealth()
      setBackendOnline(true)
    } catch (error) {
      setBackendOnline(false)
    } finally {
      setChecking(false)
    }
  }

  const handleLogin = async (values: any) => {
    setLoading(true)
    try {
      const res: any = await authApi.login(values)
      if (res.code === 1) {
        setUser(res.data, res.data.token)
        message.success('登录成功')
        navigate('/chat')
      } else {
        message.error(res.msg || '登录失败')
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !backendOnline) {
        message.error('后端服务未启动，请先启动 Spring Boot (端口 8080)')
      } else {
        message.error(error.msg || error.message || '登录失败，请检查用户名和密码')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const res: any = await authApi.register(values)
      if (res.code === 1) {
        message.success('注册成功，请登录')
        form.setFieldsValue({ username: values.username, password: '' })
      } else {
        message.error(res.msg || '注册失败')
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !backendOnline) {
        message.error('后端服务未启动，请先启动 Spring Boot (端口 8080)')
      } else {
        message.error(error.msg || error.message || '注册失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form form={form} name="login" onFinish={handleLogin}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form name="register" onFinish={handleRegister}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ type: 'email', message: '请输入有效的邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div className="login-container">
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🏃‍♂️ Race</h1>
          <p style={{ color: '#666' }}>运动竞赛系统</p>
        </div>
        {checking ? (
          <Alert
            message={<span><Spin size="small" /> 正在检测后端连接...</span>}
            type="info"
            style={{ marginBottom: 16 }}
          />
        ) : backendOnline ? (
          <Alert
            message={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 后端服务已连接 (端口 8080)</span>}
            type="success"
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            message={<span><CloseCircleOutlined /> 后端服务未启动</span>}
            description="请用 IDEA 打开 server 项目，启动 ServerApplication.java (端口 8080)"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Tabs defaultActiveKey="login" items={tabItems} centered />
      </Card>
    </div>
  )
}

export default Login