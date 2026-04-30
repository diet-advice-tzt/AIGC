import React, { useState, useEffect } from 'react'
import { stepsApi } from '../api'
import { useUserStore } from '../store/userStore'
import dayjs from 'dayjs'

interface DailySteps {
  date: string
  steps: number
  rank: number
  aiEvaluation: string | null
}

const TARGET = 10000

const Steps: React.FC = () => {
  const { user } = useUserStore()
  const userId = user?.id ? Number(user.id) : 0

  const [dailyData, setDailyData] = useState<DailySteps | null>(null)
  const [inputSteps, setInputSteps] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const today = dayjs().format('YYYY-MM-DD')

  const loadDailySteps = async () => {
    if (!userId) return
    try {
      // GET /user/steps/daily?userId=&date=
      const res: any = await stepsApi.getDailySteps(userId, today)
      if (res.code === 1 && res.data) {
        setDailyData(res.data)
      }
    } catch {
      // 无数据时忽略
    } finally {
      setLoadingData(false)
    }
  }

  // 后端没有专门的排名列表接口，getDailySteps 返回的 rank 字段是当前用户排名
  // 排行榜用同一接口（模式：只展示自己当天排名信息）
  useEffect(() => {
    loadDailySteps()
  }, [userId])

  const handleUpload = async () => {
    const steps = parseInt(inputSteps, 10)
    if (!steps || steps <= 0) {
      setError('请输入有效的步数（正整数）')
      return
    }
    setError('')
    setSuccessMsg('')
    setUploading(true)
    try {
      // POST /user/steps/batch  body: { userId, stepDate, steps }
      const res: any = await stepsApi.uploadSteps({
        userId,
        stepDate: today,
        steps,
      })
      if (res.code === 1) {
        setSuccessMsg('步数上传成功！')
        setInputSteps('')
        await loadDailySteps()
      } else {
        setError(res.msg ?? '上传失败')
      }
    } catch (err: any) {
      setError(err?.msg ?? '上传失败，请检查后端连接')
    } finally {
      setUploading(false)
    }
  }

  const steps = dailyData?.steps ?? 0
  const rank = dailyData?.rank ?? null
  const aiEval = dailyData?.aiEvaluation ?? null
  const pct = Math.min(Math.round((steps / TARGET) * 100), 100)

  const rankLabel = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 今日步数卡片 ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '36px 32px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          今日步数
        </div>

        {loadingData ? (
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>加载中…</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, color: 'var(--text)' }}>
                {steps.toLocaleString()}
              </span>
              <span style={{ fontSize: 18, color: 'var(--text-sub)' }}>步</span>
            </div>

            {rank !== null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20,
              }}>
                🏆 当前排名第 {rank} 名
              </div>
            )}

            {/* Progress */}
            <div>
              <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#16a34a' : 'var(--text)', borderRadius: 99, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mute)' }}>
                <span>{pct}% 已完成</span>
                <span>目标 {TARGET.toLocaleString()} 步</span>
              </div>
            </div>

            {/* AI 建议 */}
            {aiEval && (
              <div style={{
                marginTop: 20, padding: '12px 16px',
                background: 'var(--bg)', borderRadius: 8,
                fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6,
                borderLeft: '3px solid var(--accent)',
              }}>
                💡 {aiEval}
              </div>
            )}
          </>
        )}

        {/* 上传区 */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 10 }}>上报今日步数</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              min={1}
              value={inputSteps}
              onChange={(e) => setInputSteps(e.target.value)}
              placeholder="请输入步数"
              className="form-input"
              style={{ flex: 1, height: 42 }}
              onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
              disabled={uploading}
            />
            <button
              className="login-submit"
              style={{ width: 100, height: 42, marginTop: 0, flexShrink: 0 }}
              onClick={handleUpload}
              disabled={uploading || !inputSteps}
            >
              {uploading ? '上传中…' : '上传'}
            </button>
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
          {successMsg && <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a' }}>{successMsg}</div>}
        </div>
      </div>

      {/* ── 我的排名 ── */}
      {dailyData && rank !== null && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>我的今日排名</div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'var(--accent-bg)',
            borderRadius: 10,
            border: '1px solid var(--accent)',
          }}>
            <div className={`rank-pos ${rankLabel}`} style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, flexShrink: 0,
              background: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'var(--border)',
              color: rank <= 3 ? '#fff' : 'var(--text-sub)',
            }}>
              {rank}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user?.username}</div>
              {aiEval && <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{aiEval}</div>}
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                {steps.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 3 }}>步</span>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-mute)', textAlign: 'center' }}>
            排行榜实时更新，上传步数后刷新查看
          </div>
        </div>
      )}
    </div>
  )
}

export default Steps
