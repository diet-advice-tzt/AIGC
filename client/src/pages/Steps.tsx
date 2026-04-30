import React, { useState, useEffect } from 'react'
import { Card, List, Statistic, Progress, Button, InputNumber, message, Tag, Avatar } from 'antd'
import { TrophyOutlined, UserOutlined, FireOutlined } from '@ant-design/icons'
import { stepsApi } from '../api'

interface UserRank {
  userId: string
  username: string
  steps: number
  rank: number
  aiEvaluation?: string
}

const Steps: React.FC = () => {
  const [todaySteps, setTodaySteps] = useState(0)
  const [inputSteps, setInputSteps] = useState(0)
  const [rankings, setRankings] = useState<UserRank[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTodaySteps()
    loadRankings()
  }, [])

  const loadTodaySteps = async () => {
    try {
      const res: any = await stepsApi.getTodaySteps()
      if (res.code === 1) {
        setTodaySteps(res.data?.steps || 0)
      }
    } catch (error) {
      console.error('Load steps failed')
    }
  }

  const loadRankings = async () => {
    try {
      const res: any = await stepsApi.getRankings()
      if (res.code === 1) {
        setRankings(res.data || [])
      }
    } catch (error) {
      console.error('Load rankings failed')
    }
  }

  const handleUpdateSteps = async () => {
    if (inputSteps <= 0) {
      message.warning('请输入有效的步数')
      return
    }
    setLoading(true)
    try {
      const res: any = await stepsApi.updateSteps({ steps: inputSteps })
      if (res.code === 1) {
        message.success('步数更新成功')
        loadTodaySteps()
        loadRankings()
        setInputSteps(0)
      } else {
        message.error(res.msg || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-1'
    if (rank === 2) return 'rank-2'
    if (rank === 3) return 'rank-3'
    return ''
  }

  const targetSteps = 10000

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card title="👟 今日步数" className="steps-card">
        <Statistic
          title="今日已走"
          value={todaySteps}
          suffix="步"
          prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
          valueStyle={{ color: '#1890ff', fontSize: 48 }}
        />
        <div style={{ marginTop: 24 }}>
          <p>今日目标: {targetSteps} 步</p>
          <Progress
            percent={Math.min(Math.round((todaySteps / targetSteps) * 100), 100)}
            status={todaySteps >= targetSteps ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
          <InputNumber
            min={0}
            value={inputSteps}
            onChange={(v) => setInputSteps(v || 0)}
            placeholder="输入步数"
            size="large"
            style={{ flex: 1 }}
          />
          <Button type="primary" loading={loading} onClick={handleUpdateSteps} size="large">
            更新步数
          </Button>
        </div>
      </Card>

      <Card title={<><TrophyOutlined /> 今日排行榜</>}>
        <List
          dataSource={rankings}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <span className={`rank-badge ${getRankClass(item.rank)}`}>
                    {item.rank}
                  </span>
                }
                title={
                  <span>
                    <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    {item.username}
                    {item.rank <= 3 && <Tag color="gold" style={{ marginLeft: 8 }}>Top {item.rank}</Tag>}
                  </span>
                }
                description={item.aiEvaluation || '继续加油！'}
              />
              <div>
                <Statistic value={item.steps} suffix="步" valueStyle={{ fontSize: 20 }} />
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Steps