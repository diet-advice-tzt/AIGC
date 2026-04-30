import React, { useState } from 'react'
import { Card, Form, Input, Button, Avatar, message, Upload } from 'antd'
import { UserOutlined, CameraOutlined } from '@ant-design/icons'
import { useUserStore } from '../store/userStore'

const Profile: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleUpdate = async (_values: any) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="👤 个人中心">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Upload showUploadList={false} beforeUpload={() => false}>
            <Avatar size={120} icon={<UserOutlined />} src={user?.avatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ marginTop: 8, cursor: 'pointer' }}>
              <CameraOutlined /> 更换头像
            </div>
          </Upload>
          <h2 style={{ marginTop: 16 }}>{user?.username}</h2>
          <p style={{ color: '#666' }}>{user?.email}</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
          onFinish={handleUpdate}
        >
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
            <Input size="large" placeholder="选填" />
          </Form.Item>

          <Form.Item name="oldPassword" label="当前密码">
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item name="newPassword" label="新密码">
            <Input.Password size="large" placeholder="不修改请留空" />
          </Form.Item>

          <Form.Item name="confirmPassword" label="确认新密码">
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile