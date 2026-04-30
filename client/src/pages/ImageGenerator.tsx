import React, { useState } from 'react'
import { imageApi } from '../api'
import { useUserStore } from '../store/userStore'

const ImageGenerator: React.FC = () => {
  const { user } = useUserStore()
  const userId = String(user?.id ?? '')
  const sessionId = String((user as any)?.sessionId ?? '')

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    const text = prompt.trim()
    if (!text) {
      setError('请输入图片描述')
      return
    }
    setError('')
    setLoading(true)
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
      } else {
        setError(res.msg ?? '生成失败，请重试')
      }
    } catch (err: any) {
      setError(err?.msg ?? err?.message ?? '生成失败，请检查后端连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="image-page">
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
