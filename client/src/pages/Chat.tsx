import React, { useState, useRef, useEffect, useCallback } from 'react'
import { chatApi } from '../api'
import { useUserStore } from '../store/userStore'
import { MOCK_SESSIONS, MOCK_MESSAGES, getMockAiReply, MOCK_TOKEN } from '../mock'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  time: string
}

interface Session {
  sessionId: string
  label: string
  createdAt: string
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

// mock 模式：token 是 mock token 时使用本地数据
const isMock = (token: string | null) => token === MOCK_TOKEN

const Chat: React.FC = () => {
  const { user, token } = useUserStore()
  const userId = String(user?.id ?? '')
  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U'
  const useMock = isMock(token)

  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // 加载历史记录
  const loadHistory = useCallback(async (_sid: string) => {
    if (useMock) {
      const msgs = MOCK_MESSAGES[_sid] ?? []
      setMessages(msgs.map((m) => ({ ...m })))
      return
    }
    if (!userId) return
    try {
      const res: any = await chatApi.getHistory(userId)
      if (res.code === 1 && Array.isArray(res.data)) {
        const mapped: Message[] = res.data.map((item: any, i: number) => ({
          id: String(i),
          content: item.content ?? item.question ?? item.Respond ?? JSON.stringify(item),
          role: (item.role === 'user' || item.type === 'user') ? 'user' : 'assistant',
          time: item.createdAt ?? item.create_time ?? new Date().toISOString(),
        }))
        setMessages(mapped)
      }
    } catch {
      // 查询历史失败时不影响使用
    }
  }, [userId, useMock])

  // 首次进入：创建新会话
  useEffect(() => {
    if (useMock) {
      // mock 模式：直接加载演示会话
      setSessions(MOCK_SESSIONS.map((s) => ({ ...s })))
      setCurrentSessionId(MOCK_SESSIONS[0].sessionId)
      const msgs = MOCK_MESSAGES[MOCK_SESSIONS[0].sessionId] ?? []
      setMessages(msgs.map((m) => ({ ...m })))
      return
    }
    if (!userId) return
    handleNewSession()
  }, [userId, useMock])

  const handleNewSession = async () => {
    if (useMock) {
      const newSid = `mock-s-${Date.now()}`
      const newSession: Session = {
        sessionId: newSid,
        label: `对话 ${sessions.length + 1}`,
        createdAt: new Date().toISOString(),
      }
      setSessions((prev) => [newSession, ...prev])
      setCurrentSessionId(newSid)
      setMessages([])
      return
    }
    if (!userId) return
    try {
      const res: any = await chatApi.newSession(userId)
      if (res.code === 1 && res.data?.SessionId) {
        const sid: string = res.data.SessionId
        const newSession: Session = {
          sessionId: sid,
          label: `对话 ${sessions.length + 1}`,
          createdAt: new Date().toISOString(),
        }
        setSessions((prev) => [newSession, ...prev])
        setCurrentSessionId(sid)
        setMessages([])
      }
    } catch {
      // 后端未启动时忽略
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      time: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    if (useMock) {
      // mock 模式：模拟 600ms 延迟后返回本地回复
      await new Promise((r) => setTimeout(r, 600))
      const aiMsg: Message = {
        id: Date.now().toString() + 'ai',
        content: getMockAiReply(text),
        role: 'assistant',
        time: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setLoading(false)
      return
    }

    try {
      const res: any = await chatApi.sendMessage({
        question: text,
        userId,
        sessionId: currentSessionId,
      })

      if (res.code === 1) {
        const respond = res.data?.Respond ?? res.data?.content ?? ''
        const aiMsg: Message = {
          id: Date.now().toString() + 'ai',
          content: respond,
          role: 'assistant',
          time: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + 'err',
          content: res.msg ?? '请求失败，请重试',
          role: 'assistant',
          time: new Date().toISOString(),
        }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + 'err',
        content: '网络错误，请检查后端连接',
        role: 'assistant',
        time: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const switchSession = (sid: string) => {
    setCurrentSessionId(sid)
    setMessages([])
    loadHistory(sid)
  }

  return (
    <div className="chat-layout" style={{ margin: '-28px', height: 'calc(100vh - 56px)' }}>
      {/* Session Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span className="chat-sidebar-title">对话</span>
          <button
            className="new-chat-btn"
            onClick={handleNewSession}
            title="新建对话"
          >
            +
          </button>
        </div>
        <div className="session-list">
          {sessions.length === 0 && (
            <div style={{ padding: '20px 12px', fontSize: 13, color: 'var(--text-mute)', textAlign: 'center' }}>
              点击 + 开始新对话
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.sessionId}
              className={`session-item ${currentSessionId === s.sessionId ? 'active' : ''}`}
              onClick={() => switchSession(s.sessionId)}
            >
              <div className="session-item-name">{s.label}</div>
              <div className="session-item-meta">{fmt(s.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Main */}
      <div className="chat-main">
        {useMock && (
          <div style={{
            padding: '6px 16px', background: '#fef3c7', borderBottom: '1px solid #fcd34d',
            fontSize: 12, color: '#92400e', textAlign: 'center',
          }}>
            演示模式 — 当前展示的是 mock 数据，启动后端后刷新即可切换为真实数据
          </div>
        )}
        <div className="chat-messages-area">
          {messages.length === 0 && !loading ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <div className="chat-empty-text">和 AI 开始对话</div>
              <div className="chat-empty-hint">输入任何问题，AI 会给你运动建议</div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.role}`}>
                <div className={`msg-avatar ${msg.role === 'assistant' ? 'ai' : 'user-av'}`}>
                  {msg.role === 'assistant' ? 'AI' : initial}
                </div>
                <div>
                  <div className="msg-bubble" style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                  <div className="msg-time">{fmt(msg.time)}</div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="msg-row">
              <div className="msg-avatar ai">AI</div>
              <div>
                <div className="msg-bubble" style={{ padding: '14px 16px' }}>
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行…"
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn ant-btn ant-btn-primary"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}
            >
              ↑
            </button>
          </div>
          <div className="chat-hint">Enter 发送 · Shift+Enter 换行</div>
        </div>
      </div>
    </div>
  )
}

export default Chat
