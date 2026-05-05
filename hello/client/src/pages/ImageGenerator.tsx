import React, { useState } from 'react'
import { imageApi } from '../api'
import { useUserStore } from '../store/userStore'
import { MOCK_IMAGES, MOCK_TOKEN } from '../mock'

const ImageGenerator: React.FC = () => {
  const { user, token } = useUserStore()
  const userId = String(user?.id ?? '')
  const sessionId = String((user as any)?.sessionId ?? '')
  const useMock = token === MOCK_TOKEN

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(useMock ? [...MOCK_IMAGES] : [])
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    const text = prompt.trim()
    if (!text) {
      setError('请输入图片描述')
      return
    }
    setError('')
    setLoading(true)

    if (useMock) {
      // mock 模式：模拟 1s 生成延迟，返回随机占位图
      await new Promise((r) => setTimeout(r, 1000))
      const seed = encodeURIComponent(text.slice(0, 10)) + Date.now()
      const mockUrl = `https://picsum.photos/seed/${seed}/400/400`
      setImages((prev) => [mockUrl, ...prev])
      setPrompt('')
      setLoading(false)
      return
    }

    try {
      // POST /user/picture  body: { picture, userId, sessionId }
      // 后端返回 Result<String>，data 直接是图片 URL
      const res: any = await imageApi.generate({
        picture: text,
        userId,
        sessionId,
      })
      if (res.code === 1 && res.data) {
        setImages((prev) => [res.data, ...prev])
        setPrompt('')
        // 打印成功详情
        console.log('图像生成成功:', {
          model: res.detail?.model,
          prompt: res.detail?.prompt,
          url: res.data,
        })
      } else {
        // 显示详细错误信息
        const detailMsg = res.detail 
          ? `\n详情: ${JSON.stringify(res.detail, null, 2)}` 
          : ''
        setError(res.msg ?? '生成失败，请重试' + detailMsg)
        console.error('图像生成失败:', res)
      }
    } catch (err: any) {
      // 显示详细错误信息
      const detailMsg = err?.detail 
        ? `\n详情: ${JSON.stringify(err.detail, null, 2)}` 
        : ''
      setError((err?.msg ?? err?.message ?? '生成失败，请检查后端连接') + detailMsg)
      console.error('图像生成异常:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="image-page">
      {useMock && (
        <div style={{
          padding: '8px 14px', background: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 4,
        }}>
          演示模式 — 图片生成将返回随机占位图，启动后端后刷新即可切换为 AI 真实生成
        </div>
      )}

      {/* Prompt Area */}
      <div className="image-prompt-card">
        <div className="image-prompt-label">描述你想要的图片</div>
        <div className="image-input-row">
          <input
            className="form-input"
            style={{ flex: 1, height: 44 }}
            type="text"
            placeholder="例如：一只可爱的猫咪在樱花树下奔跑…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={loading}
          />
          <button
            className="login-submit"
            style={{ width: 120, height: 44, marginTop: 0, flexShrink: 0 }}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? '生成中…' : '生成图片'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#dc2626' }}>{error}</div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="image-generating">
          <div className="image-generating-spinner" />
          <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>AI 正在作画，请稍候…</span>
        </div>
      )}

      {/* Gallery */}
      {images.length > 0 && !loading && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            已生成 {images.length} 张
          </div>
          <div className="image-grid">
            {images.map((url, i) => (
              <div key={i} className="image-item">
                <img
                  src={url}
                  alt={`生成图片 ${i + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {images.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-mute)', fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: .3 }}>🎨</div>
          <div>还没有生成的图片，输入描述开始创作吧</div>
        </div>
      )}
    </div>
  )
}

export default ImageGenerator
