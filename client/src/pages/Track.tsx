import React, { useState, useEffect, useRef, useCallback } from 'react'
import { trackApi } from '../api'
import { useUserStore } from '../store/userStore'
import { MOCK_TRACK, MOCK_TOKEN } from '../mock'

interface LocationPoint {
  latitude: number
  longitude: number
  time: string
}

interface TrackData {
  trackId: string
  totalDistance: number
  points: LocationPoint[]
}

type WsStatus = 'disconnected' | 'connecting' | 'connected'

const Track: React.FC = () => {
  const { user, token } = useUserStore()
  const userId = user?.id ? Number(user.id) : 0
  const useMock = token === MOCK_TOKEN

  // WebSocket 状态
  const wsRef = useRef<WebSocket | null>(null)
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected')

  // 实时轨迹状态
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [totalDistance, setTotalDistance] = useState<number>(0)
  const [aiRemark, setAiRemark] = useState<string>('')
  const [pointCount, setPointCount] = useState(0)
  const [lastTrackId, setLastTrackId] = useState<string>('')

  // 查询历史轨迹
  const [trackIdInput, setTrackIdInput] = useState('')
  const [historyTrack, setHistoryTrack] = useState<TrackData | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // 地图 ref（高德，如果有 AMap script 则渲染）
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const pointsRef = useRef<[number, number][]>([])

  // mock 轨迹回放计时器
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    if (!userId) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    const wsBase = window.location.host.replace(/:\d+$/, ':8080')
    const url = `ws://${wsBase}/realtime/${userId}`
    setWsStatus('connecting')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setWsStatus('connected')
    ws.onclose = () => setWsStatus('disconnected')
    ws.onerror = () => setWsStatus('disconnected')

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        if (data.remark) setAiRemark(data.remark)
        if (data.trackId) setLastTrackId(data.trackId)
        if (data.totalDistance !== undefined) setTotalDistance(data.totalDistance)
      } catch {/* ignore */}
    }
  }, [userId])

  const disconnectWs = () => {
    wsRef.current?.close()
    wsRef.current = null
    setWsStatus('disconnected')
  }

  useEffect(() => {
    return () => { wsRef.current?.close() }
  }, [])

  // ── 地图初始化 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const win = window as any
    if (!win.AMap || !mapRef.current) return
    if (mapInstance.current) return

    try {
      mapInstance.current = new win.AMap.Map(mapRef.current, {
        zoom: 15,
        center: [116.4, 39.9],
        mapStyle: 'amap://styles/light',
      })
    } catch { /* AMap 未加载时忽略 */ }
  }, [])

  // ── 发送定位点 ──────────────────────────────────────────────────────────────
  const sendLocation = useCallback((lat: number, lng: number) => {
    if (!useMock) {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      const payload = {
        userId,
        latitude: lat,
        longitude: lng,
        recordTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      wsRef.current.send(JSON.stringify(payload))
    }

    setPointCount((c) => c + 1)

    // 更新地图轨迹
    const win = window as any
    if (mapInstance.current && win.AMap) {
      const pt: [number, number] = [lng, lat]
      pointsRef.current = [...pointsRef.current, pt]

      if (polylineRef.current) {
        polylineRef.current.setPath(pointsRef.current)
      } else {
        polylineRef.current = new win.AMap.Polyline({
          path: pointsRef.current,
          strokeColor: '#1a1a1a',
          strokeWeight: 3,
          strokeOpacity: 0.8,
        })
        mapInstance.current.add(polylineRef.current)
      }

      if (!markerRef.current) {
        markerRef.current = new win.AMap.Marker({ position: pt })
        mapInstance.current.add(markerRef.current)
      } else {
        markerRef.current.setPosition(pt)
      }

      mapInstance.current.setCenter(pt)
    }
  }, [userId, useMock])

  // ── GPS 追踪 ────────────────────────────────────────────────────────────────
  const geoWatchRef = useRef<number | null>(null)

  const startTracking = () => {
    if (useMock) {
      // mock 模式：逐点回放 MOCK_TRACK
      setWsStatus('connected')
      setLastTrackId(MOCK_TRACK.trackId)
      let idx = 0
      const pts = MOCK_TRACK.points
      mockTimerRef.current = setInterval(() => {
        if (idx >= pts.length) {
          if (mockTimerRef.current) clearInterval(mockTimerRef.current)
          setAiRemark('很棒！你完成了今天的晨跑，总距离约 3.2 公里，配速稳定，继续保持！')
          setTotalDistance(MOCK_TRACK.totalDistance)
          return
        }
        const p = pts[idx]
        setCurrentLat(p.latitude)
        setCurrentLng(p.longitude)
        setTotalDistance(Math.round((idx / pts.length) * MOCK_TRACK.totalDistance))
        sendLocation(p.latitude, p.longitude)
        idx++
      }, 500)
      return
    }

    if (!navigator.geolocation) {
      alert('您的浏览器不支持 GPS 定位')
      return
    }
    connectWs()
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCurrentLat(lat)
        setCurrentLng(lng)
        sendLocation(lat, lng)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const stopTracking = () => {
    if (mockTimerRef.current) {
      clearInterval(mockTimerRef.current)
      mockTimerRef.current = null
    }
    if (geoWatchRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchRef.current)
      geoWatchRef.current = null
    }
    disconnectWs()
    pointsRef.current = []
    setPointCount(0)
    setCurrentLat(null)
    setCurrentLng(null)
    if (useMock) setWsStatus('disconnected')
  }

  const isTracking = useMock
    ? mockTimerRef.current !== null
    : geoWatchRef.current !== null

  // ── 查询历史轨迹 ────────────────────────────────────────────────────────────
  const loadHistoryTrack = async () => {
    const tid = trackIdInput.trim()
    if (!tid) {
      setHistoryError('请输入 Track ID')
      return
    }
    setHistoryError('')
    setLoadingHistory(true)

    if (useMock) {
      await new Promise((r) => setTimeout(r, 300))
      if (tid === MOCK_TRACK.trackId || tid.toLowerCase().includes('mock')) {
        setHistoryTrack(MOCK_TRACK)
      } else {
        setHistoryError('未找到该轨迹（演示模式可输入 mock-track-20260430）')
      }
      setLoadingHistory(false)
      return
    }

    try {
      const res: any = await trackApi.getTrack(tid)
      if (res.code === 1 && res.data) {
        setHistoryTrack(res.data)
      } else {
        setHistoryError(res.msg ?? '未找到该轨迹')
      }
    } catch (err: any) {
      setHistoryError(err?.msg ?? '查询失败')
    } finally {
      setLoadingHistory(false)
    }
  }

  const wsStatusLabel = {
    disconnected: '未连接',
    connecting: '连接中…',
    connected: '已连接',
  }[wsStatus]

  const wsStatusDot = wsStatus === 'connected' ? 'connected' : wsStatus === 'connecting' ? 'connecting' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: 'calc(100vh - 56px - 56px)', minHeight: 500 }}>

      {useMock && (
        <div style={{
          padding: '6px 14px', background: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: 8, fontSize: 12, color: '#92400e', flexShrink: 0,
        }}>
          演示模式 — 点击「开始记录轨迹」将回放预置路线坐标，Track ID 可输入 <strong>mock-track-20260430</strong> 查询历史
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* ── 地图主区域 ── */}
        <div style={{
          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>实时轨迹</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-sub)' }}>
              <span className={`ws-dot ${wsStatusDot}`} style={{
                width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                background: wsStatus === 'connected' ? '#16a34a' : wsStatus === 'connecting' ? '#d97706' : '#94a3b8',
                ...(wsStatus === 'connected' ? { boxShadow: '0 0 0 2px #dcfce7' } : {}),
              }} />
              {wsStatusLabel}
            </div>
          </div>

          {/* Map */}
          <div ref={mapRef} style={{ flex: 1, background: 'var(--bg)', position: 'relative' }}>
            {!(window as any).AMap && (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-mute)',
              }}>
                <div style={{ fontSize: 48, opacity: .25 }}>🗺️</div>
                {useMock && currentLat !== null ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>轨迹回放中…</div>
                    <div style={{ fontSize: 12 }}>当前坐标：{currentLat.toFixed(5)}, {currentLng?.toFixed(5)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>已记录 {pointCount} 个轨迹点</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13 }}>地图加载中 / 需要高德 AMap SDK</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>
                      轨迹坐标会通过 WebSocket 实时上报到后端
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <button
              className="login-submit"
              style={{ flex: 1, height: 40, marginTop: 0, background: isTracking ? '#dc2626' : undefined }}
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? '停止记录' : '开始记录轨迹'}
            </button>
          </div>
        </div>

        {/* ── 右侧面板 ── */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 实时数据 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              实时数据
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 4 }}>轨迹点</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>{pointCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 4 }}>累计距离</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>{totalDistance}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>m</span></div>
              </div>
            </div>

            {currentLat !== null && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>当前坐标</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', fontFamily: 'var(--font-mono)' }}>
                  {currentLat.toFixed(6)}, {currentLng?.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          {/* AI 建议 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              AI 实时点评
            </div>
            {aiRemark ? (
              <div style={{
                fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.65,
                borderLeft: '3px solid var(--accent)', paddingLeft: 12,
              }}>
                {aiRemark}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
                开始记录后，AI 会根据轨迹给出建议
              </div>
            )}
            {lastTrackId && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                Track ID: {lastTrackId}
              </div>
            )}
          </div>

          {/* 查询历史轨迹 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              查询历史轨迹
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                className="form-input"
                style={{ flex: 1, height: 36, fontSize: 12 }}
                placeholder={useMock ? 'mock-track-20260430' : '输入 Track ID'}
                value={trackIdInput}
                onChange={(e) => setTrackIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadHistoryTrack()}
              />
              <button
                className="login-submit"
                style={{ width: 60, height: 36, marginTop: 0, fontSize: 13, flexShrink: 0 }}
                onClick={loadHistoryTrack}
                disabled={loadingHistory}
              >
                {loadingHistory ? '…' : '查询'}
              </button>
            </div>
            {historyError && <div style={{ fontSize: 12, color: '#dc2626' }}>{historyError}</div>}

            {historyTrack && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 6 }}>
                  总距离：{historyTrack.totalDistance} m　·　轨迹点：{historyTrack.points.length}
                </div>
                <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                  {historyTrack.points.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', padding: '2px 0' }}>
                      {i + 1}. {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Track
