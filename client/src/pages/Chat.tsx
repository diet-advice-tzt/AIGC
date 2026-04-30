import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, List, Card, Spin, Empty, Avatar, Tag, message } from 'antd'
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { chatApi } from '../api'

const { TextArea } = Input

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
}

interface Session {
  id: string
  name: string
  createdAt: string
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<string>('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res: any = await chatApi.getSessions()
      if (res.code === 1 && res.data) {
        setSessions(res.data)
        if (res.data.length > 0) {
          setCurrentSession(res.data[0].id)
          loadHistory(res.data[0].id)
        }
      }
    } catch (error) {
      console.error('Load sessions failed')
    }
  }

  const loadHistory = async (sessionId: string) => {
    try {
      const res: any = await chatApi.getHistory(sessionId)
      if (res.code === 1) {
        setMessages(res.data || [])
      }
    } catch (error) {
      console.error('Load history failed')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res: any = await chatApi.sendMessage({
        sessionId: currentSession,
        content: input,
      })

      if (res.code === 1) {
        const aiMessage: Message = {
          id: Date.now().toString() + 'ai',
          content: res.data.content,
          role: 'assistant',
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        message.error(res.msg || '发送失败')
      }
    } catch (error) {
      message.error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const createNewSession = () => {
    const newId = Date.now().toString()
    setCurrentSession(newId)
    setMessages([])
    setSessions((prev) => [
      { id: newId, name: '新对话', createdAt: new Date().toISOString() },
      ...prev,
    ])
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 16 }}>
      <Card
        style={{ width: 240, flexShrink: 0 }}
        title="对话列表"
        extra={
          <Button type="text" icon={<PlusOutlined />} onClick={createNewSession}>
            新建
          </Button>
        }
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={sessions}
          renderItem={(item) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                background: currentSession === item.id ? '#e6f7ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
              }}
              onClick={() => {
                setCurrentSession(item.id)
                loadHistory(item.id)
              }}
              actions={[
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<RobotOutlined />} />}
                title={item.name}
                description={new Date(item.createdAt).toLocaleDateString()}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <Empty description="开始和 AI 对话吧" />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-item ${msg.role}`}>
                <Avatar icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} style={{ margin: '0 8px' }} />
                <div className="message-content">
                  {msg.role === 'assistant' && <Tag color="blue">AI</Tag>}
                  <p>{msg.content}</p>
                  <small style={{ opacity: 0.6 }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message-item">
              <Avatar icon={<RobotOutlined />} style={{ margin: '0 8px' }} />
              <div className="message-content">
                <Spin size="small" /> AI 正在思考...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="输入消息..."
              rows={2}
              disabled={loading}
            />
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleSend} style={{ height: 'auto' }}>
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Chat