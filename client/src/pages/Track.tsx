import React, { useState, useEffect, useRef } from 'react'
import { Card, List, Statistic, Tag, Space, Empty, Button, Modal, Row, Col, Select, Input, InputNumber, message, Tabs } from 'antd'
import { EnvironmentOutlined, ClockCircleOutlined, FireOutlined, ThunderboltOutlined, SunOutlined, CloudOutlined, PlusOutlined, GlobalOutlined } from '@ant-design/icons'
import { trackApi } from '../api'




interface Track {
  id: string
  date: string
  timeOfDay?: string
  city?: string
  cityCode?: string
  routeName: string
  distance: number
  duration: number
  pace: string
  avgPace: string
  bestPace: string
  calories: number
  heartRate: number
  cadence: number
  stride: string
  points: [number, number][]
  pointCount: number
  centerPoint?: [number, number]
  startPoint: [number, number]
  endPoint: [number, number]
  difficulty?: string
  scenery?: string
  weather: string
  temperature: number
  humidity: number
  feeling: string
  elevation: number
  steps: number
}

const Track: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [addVisible, setAddVisible] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [cities, setCities] = useState<string[]>([])
  const [cityRoutes, setCityRoutes] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [customForm, setCustomForm] = useState({ name: '', lng: 116.4, lat: 39.9, distance: 5 })
  

  useEffect(() => {
    loadTracks()
    loadCities()
  }, [])

  useEffect(() => {
    if (addVisible && customForm.lng === 116.4 && customForm.name === '') {
      message.info('📍 正在请求位置权限...', 3)
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCustomForm({
              ...customForm,
              lng: parseFloat(position.coords.longitude.toFixed(4)),
              lat: parseFloat(position.coords.latitude.toFixed(4)),
              name: '我的跑步位置'
            })
            message.success('✅ 自动定位成功！地图已显示你的位置')
          },
          () => {
            message.info('💡 你可以直接搜索地点，或手动输入经纬度')
          },
          { timeout: 10000 }
        )
      }
    }
  }, [addVisible])



  declare const AMap: any
  
  const customMapRef = useRef<any>(null)
  const customMapInstance = useRef<any>(null)

  useEffect(() => {
    if (!addVisible) return
    
    const initMap = () => {
      if (!customMapRef.current) return
      
      try {
        customMapInstance.current = new AMap.Map(customMapRef.current, {
          zoom: 15,
          center: [customForm.lng, customForm.lat],
          mapStyle: 'amap://styles/normal'
        })
        
        customMapInstance.current.addControl(new AMap.ToolBar())
        
        const marker = new AMap.Marker({
          position: [customForm.lng, customForm.lat],
          draggable: true,
          title: '拖动我选位置'
        })
        
        const getAddress = (lng: number, lat: number) => {
          const geocoder = new AMap.Geocoder()
          geocoder.getAddress([lng, lat], (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              setCustomForm(prev => ({
                ...prev,
                lng, lat,
                name: result.regeocode.formattedAddress || '地图选点'
              }))
            }
          })
        }
        
        marker.on('dragend', (e: any) => {
          getAddress(e.lnglat.lng, e.lnglat.lat)
        })
        
        customMapInstance.current.on('click', (e: any) => {
          marker.setPosition(e.lnglat)
          getAddress(e.lnglat.lng, e.lnglat.lat)
        })
        
        customMapInstance.current.add(marker)
        
      } catch (e) {
        console.log('地图加载', e)
      }
    }
    
    setTimeout(initMap, 300)
    
    return () => {
      if (customMapInstance.current) {
        customMapInstance.current.destroy()
        customMapInstance.current = null
      }
    }
  }, [addVisible])

  useEffect(() => {
    if (customMapInstance.current) {
      customMapInstance.current.setCenter([customForm.lng, customForm.lat])
    }
  }, [customForm.lng, customForm.lat])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const res: any = await trackApi.getTracks()
      if (res.code === 1) {
        setTracks(res.data || [])
      }
    } catch (error) {
      console.error('Load tracks failed')
    } finally {
      setLoading(false)
    }
  }

  const loadCities = async () => {
    try {
      const res: any = await trackApi.getCities()
      if (res.code === 1) {
        setCities(res.data || [])
      }
    } catch (error) {
      console.error('Load cities failed')
    }
  }

  const loadCityRoutes = async (city: string) => {
    try {
      const res: any = await trackApi.getRoutesByCity(city)
      if (res.code === 1) {
        setCityRoutes(res.data || [])
      }
    } catch (error) {
      console.error('Load city routes failed')
    }
  }

  const addCityRoute = async (route: any) => {
    const newTrack = {
      ...route,
      id: `track-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timeOfDay: '手动添加 ➕',
      duration: Math.floor(26 + route.distance * 5.5),
      pace: ((26 + route.distance * 5.5) / route.distance).toFixed(2),
      avgPace: ((26 + route.distance * 5.5) / route.distance).toFixed(2),
      bestPace: ((26 + route.distance * 5.5) / route.distance - 0.5).toFixed(2),
      calories: Math.floor(route.distance * 62),
      heartRate: Math.floor(140 + Math.random() * 20),
      cadence: Math.floor(165 + Math.random() * 15),
      stride: (1.15 + Math.random() * 0.2).toFixed(2),
      pointCount: route.points.length,
      weather: '晴',
      temperature: 18,
      humidity: 55,
      feeling: '路线已添加！🏃',
      elevation: Math.floor(10 + Math.random() * 20),
      steps: Math.floor(route.distance * 1320),
    }
    setTracks([newTrack, ...tracks])
    message.success(`已添加: ${route.name}`)
    setAddVisible(false)
  }

  const createCustomTrack = async () => {
    if (!customForm.name) {
      message.warning('请输入路线名称')
      return
    }
    try {
      const res: any = await trackApi.createCustomTrack(customForm)
      if (res.code === 1) {
        setTracks([res.data, ...tracks])
        message.success('自定义路线创建成功！')
        setAddVisible(false)
        setCustomForm({ name: '', lng: 116.4, lat: 39.9, distance: 5 })
      }
    } catch (error) {
      message.error('创建失败')
    }
  }

  const openTrackDetail = (track: Track) => {
    setSelectedTrack(track)
    setDetailVisible(true)
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}小时${m}分` : `${m}分钟`
  }

  const getWeatherIcon = (weather?: string) => {
    if (weather === '晴') return <SunOutlined style={{ color: '#faad14' }} />
    return <CloudOutlined style={{ color: '#8c8c8c' }} />
  }

  const totalDistance = tracks.reduce((sum, t) => sum + t.distance, 0)
  const totalTime = tracks.reduce((sum, t) => sum + t.duration, 0)
  const totalCalories = tracks.reduce((sum, t) => sum + t.calories, 0)

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={7}>
          <Card>
            <Statistic
              title="🏃 总跑步里程"
              value={totalDistance.toFixed(2)}
              suffix="公里"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <Statistic
              title="⏱️ 总运动时长"
              value={formatDuration(totalTime)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <Statistic
              title="🔥 消耗卡路里"
              value={totalCalories}
              suffix="大卡"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card bodyStyle={{ padding: '20px 15px' }}>
            <Button type="primary" icon={<PlusOutlined />} block onClick={() => setAddVisible(true)}>
              添加路线
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        title={<><EnvironmentOutlined /> 我的运动轨迹</>}
        extra={
          <Space>
            <Tag color="blue"><GlobalOutlined /> {tracks.filter(t => t.city).length} 个城市</Tag>
            <Tag color="green">{tracks.length} 条记录</Tag>
          </Space>
        }
      >
        {tracks.length === 0 ? (
          <Empty description="暂无运动记录" />
        ) : (
          <List
            loading={loading}
            dataSource={tracks}
            renderItem={(track) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => openTrackDetail(track)}>
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <span style={{ fontWeight: 600 }}>{track.date}</span>
                      <Tag>{track.timeOfDay}</Tag>
                      {track.city && <Tag color="blue">{track.city}</Tag>}
                      <Tag color="purple">{track.routeName}</Tag>
                      {track.city && getWeatherIcon(track.weather)}
                      <Tag color={track.feeling.includes('好') || track.feeling.includes('PB') ? 'green' : 'gold'}>
                        {track.feeling}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space wrap size="middle">
                      <span><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 4 }} />{track.distance} 公里</span>
                      <span><ClockCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />{formatDuration(track.duration)}</span>
                      <span><ThunderboltOutlined style={{ color: '#722ed1', marginRight: 4 }} />配速 {track.pace}</span>
                      <span>❤️ 心率 {track.heartRate}</span>
                      <span>👟 步频 {track.cadence}</span>
                      <span><FireOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />{track.calories} 大卡</span>
                      {track.scenery && <span style={{ color: '#faad14' }}>{track.scenery}</span>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={`➕ 添加跑步路线`}
        open={addVisible}
        onCancel={() => setAddVisible(false)}
        footer={null}
        width={700}
      >
        <Tabs
          defaultActiveKey="city"
          items={[
            {
              key: 'city',
              label: '🏙️ 选城市加路线（推荐）',
              children: (
                <div style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    
                    <div style={{ background: '#f6ffed', padding: '16px', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                      <p style={{ margin: '0 0 12px 0', color: '#52c41a', fontWeight: 600 }}>
                        ✅ 最简单！不用定位，直接选城市
                      </p>
                    </div>

                    <Select
                      style={{ width: '100%', fontSize: 16 }}
                      size="large"
                      placeholder="👇 先选择你所在的城市"
                      value={selectedCity}
                      onChange={(v) => { setSelectedCity(v); loadCityRoutes(v) }}
                    >
                      {cities.map(city => (
                        <Select.Option key={city} value={city}>📍 {city}</Select.Option>
                      ))}
                    </Select>

                    {selectedCity && (
                      <div>
                        <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>
                          🔥 {selectedCity} 热门跑步路线，点击直接添加：
                        </p>
                        <List
                          dataSource={cityRoutes}
                          renderItem={(route) => (
                            <Card 
                              size="small" 
                              style={{ marginBottom: 8 }}
                              hoverable
                              onClick={() => addCityRoute(route)}
                            >
                              <Space justify="space-between" style={{ width: '100%' }}>
                                <span style={{ fontWeight: 500 }}>{route.name}</span>
                                <Space>
                                  <Tag color="blue">🏃 {route.distance} 公里</Tag>
                                  <Tag color="green">{route.difficulty}</Tag>
                                  <Button type="primary" size="small">添加</Button>
                                </Space>
                              </Space>
                              <p style={{ margin: '8px 0 0 0', color: '#faad14', fontSize: 12 }}>
                                {route.scenery}
                              </p>
                            </Card>
                          )}
                        />
                      </div>
                    )}
                  </Space>
                </div>
              )
            },
            {
              key: 'custom',
              label: '📍 自定义定位',
              children: (
                <div style={{ marginTop: 20 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">

                    <Row gutter={12}>
                      <Col span={8}>
                        <Button 
                          type="primary"
                          block 
                          icon={<EnvironmentOutlined />}
                          size="large"
                          onClick={() => {
                            if (!navigator.geolocation) {
                              message.error('您的浏览器不支持定位，请用搜索功能')
                              return
                            }
                            
                            message.info('📍 正在请求位置权限...\n\n💡 请在浏览器左上角弹出的权限请求中点击「允许」', 5)
                            
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setCustomForm({
                                  ...customForm,
                                  lng: parseFloat(position.coords.longitude.toFixed(4)),
                                  lat: parseFloat(position.coords.latitude.toFixed(4)),
                                  name: '我的位置'
                                })
                                message.success('✅ GPS定位成功！地图已跳转')
                              },
                              (error) => {
                                let msg = ''
                                switch(error.code) {
                                  case 1:
                                    msg = '❌ 您拒绝了位置权限\n\n💡 解决方法：点击浏览器地址栏左边的 🔒 图标 → 位置权限 → 允许'
                                    break
                                  case 2:
                                    msg = '❌ 无法获取位置\n\n💡 建议：直接在搜索框输入地点名称'
                                    break
                                  case 3:
                                    msg = '❌ 定位超时\n\n💡 建议：直接搜索地点更快捷！'
                                    break
                                  default:
                                    msg = '❌ 定位失败，请直接搜索地点'
                                }
                                message.warning(msg, 8)
                              },
                              { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
                            )
                          }}
                        >
                          📍 GPS自动定位
                        </Button>
                      </Col>
                      <Col span={16}>
                        <Input.Search
                          placeholder="🔍 高德地图搜索：学校、小区、商场、地铁站..."
                          size="large"
                          enterButton="高德定位"
                          onSearch={async (keyword) => {
                            if (!keyword) return
                            message.loading('🔍 高德地图正在搜索...', 3)
                            
                            try {
                              if (!window.AMap || !AMap.PlaceSearch) {
                                message.error('高德地图加载中，请刷新页面重试')
                                return
                              }
                              
                              const placeSearch = new AMap.PlaceSearch({
                                city: '全国',
                                pageSize: 5,
                                pageIndex: 1
                              })
                              
                              placeSearch.search(keyword, (status: string, result: any) => {
                                if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                                  const place = result.poiList.pois[0]
                                  setCustomForm({
                                    ...customForm,
                                    lng: parseFloat(place.location.lng.toFixed(4)),
                                    lat: parseFloat(place.location.lat.toFixed(4)),
                                    name: place.name
                                  })
                                  message.success(`✅ 高德定位成功：${place.name} - ${place.address}`)
                                } else {
                                  const geocoder = new AMap.Geocoder({ city: '全国' })
                                  geocoder.getLocation(keyword, (status: string, result: any) => {
                                    if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                                      const place = result.geocodes[0]
                                      setCustomForm({
                                        ...customForm,
                                        lng: parseFloat(place.location.lng.toFixed(4)),
                                        lat: parseFloat(place.location.lat.toFixed(4)),
                                        name: place.formattedAddress || keyword
                                      })
                                      message.success(`✅ 高德定位成功：${place.formattedAddress}`)
                                    } else {
                                      message.error('❌ 高德地图没找到，请换个关键词试试')
                                    }
                                  })
                                }
                              })
                            } catch (e) {
                              message.error('❌ 搜索失败，请刷新页面重试')
                            }
                          }}
                        />
                      </Col>
                    </Row>

                    <div style={{ background: '#f6ffed', padding: '12px 16px', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                      <p style={{ margin: 0, color: '#52c41a', fontSize: 14 }}>
                        🎯 <strong>地图可交互！</strong>直接点击地图选点，或拖动红色标记调整位置！
                      </p>
                    </div>

                    <Card size="small" title="🗺️ 可交互地图 - 点击/拖拽选点">
                      <div
                        ref={customMapRef}
                        style={{ 
                          height: 300, 
                          borderRadius: 8, 
                          width: '100%',
                          overflow: 'hidden'
                        }}
                      />
                      {(customForm.lng !== 116.4 || customForm.name) && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                          <Row gutter={16}>
                            <Col span={7}>
                              <Statistic title="📍 经度" value={customForm.lng} valueStyle={{ fontSize: 14 }} />
                            </Col>
                            <Col span={7}>
                              <Statistic title="📍 纬度" value={customForm.lat} valueStyle={{ fontSize: 14 }} />
                            </Col>
                            <Col span={10}>
                              <p style={{ margin: '18px 0 0 0', fontWeight: 600, textAlign: 'right' }}>📍 {customForm.name || '我的位置'}</p>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </Card>

                    <Row gutter={12} style={{ marginBottom: 12 }}>
                      <Col span={12}>
                        <Input
                          placeholder="📍 经度，比如：121.8750"
                          value={customForm.lng}
                          onChange={(e) => setCustomForm({ ...customForm, lng: parseFloat(e.target.value) || 0 })}
                          size="large"
                        />
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="📍 纬度，比如：38.8750"
                          value={customForm.lat}
                          onChange={(e) => setCustomForm({ ...customForm, lat: parseFloat(e.target.value) || 0 })}
                          size="large"
                        />
                      </Col>
                    </Row>

                    <Input
                      placeholder="🏃 路线名称（已自动填写）"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      size="large"
                      prefix={<EnvironmentOutlined />}
                      style={{ marginBottom: 12 }}
                    />

                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="🏃 跑步距离"
                      value={customForm.distance}
                      onChange={(v) => setCustomForm({ ...customForm, distance: v || 5 })}
                      addonBefore="🏃 距离"
                      addonAfter="公里"
                      size="large"
                      min={1}
                      max={42}
                    />
                    
                    <Button type="primary" block onClick={createCustomTrack} size="large" style={{ height: 50, marginTop: 10 }}>
                      ✅ 创建这条跑步路线
                    </Button>
                  </Space>
                </div>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title={`🏃 ${selectedTrack?.city ? selectedTrack.city + ' · ' : ''}${selectedTrack?.routeName || '运动轨迹详情'}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTrack && (
          <div>
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: 'none' }}>
                  <Statistic title="🏃 里程" value={selectedTrack.distance} suffix="KM" valueStyle={{ fontSize: 22, color: '#1890ff' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: 'none' }}>
                  <Statistic title="⏱️ 时长" value={formatDuration(selectedTrack.duration)} valueStyle={{ fontSize: 22, color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', border: 'none' }}>
                  <Statistic title="⚡ 平均配速" value={selectedTrack.avgPace} suffix="分" valueStyle={{ fontSize: 22, color: '#722ed1' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', border: 'none' }}>
                  <Statistic title="🔥 卡路里" value={selectedTrack.calories} suffix="大卡" valueStyle={{ fontSize: 22, color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>

            <Card title="📊 详细数据" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic title="最佳配速" value={selectedTrack.bestPace} suffix="分/KM" />
                </Col>
                <Col span={6}>
                  <Statistic title="❤️ 平均心率" value={selectedTrack.heartRate} suffix="BPM" />
                </Col>
                <Col span={6}>
                  <Statistic title="👟 平均步频" value={selectedTrack.cadence} suffix="SPM" />
                </Col>
                <Col span={6}>
                  <Statistic title="🦵 平均步幅" value={selectedTrack.stride} suffix="米" />
                </Col>
                <Col span={6}>
                  <Statistic title="👣 总步数" value={selectedTrack.steps} />
                </Col>
                <Col span={6}>
                  <Statistic title="🗺️ 轨迹点" value={selectedTrack.pointCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="⛰️ 爬升" value={selectedTrack.elevation} suffix="米" />
                </Col>
                <Col span={6}>
                  <Statistic title="💧 湿度" value={selectedTrack.humidity} suffix="%" />
                </Col>
              </Row>
            </Card>

            <Card title="🗺️ 轨迹位置预览" size="small" style={{ marginBottom: 16 }}>
              <img
                src={`https://restapi.amap.com/v3/staticmap?location=${selectedTrack?.centerPoint?.[0] || 116.4},${selectedTrack?.centerPoint?.[1] || 39.9}&zoom=14&size=800*400&markers=mid,,A:${selectedTrack?.centerPoint?.[0] || 116.4},${selectedTrack?.centerPoint?.[1] || 39.9}&key=df2267d3484e4e4888d4e4adf5374a35`}
                style={{ 
                  borderRadius: 8, 
                  width: '100%',
                  border: '1px solid #eee'
                }}
                alt="轨迹地图"
              />
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <Space>
                  <Tag color="blue">{selectedTrack.city ? selectedTrack.city : '自定义'}</Tag>
                  <Tag>{selectedTrack.routeName}</Tag>
                  <Tag color="green">📍 {selectedTrack.points.length} 个轨迹点</Tag>
                  {selectedTrack.scenery && <Tag color="gold">{selectedTrack.scenery}</Tag>}
                </Space>
              </div>
            </Card>

            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="🌡️ 天气环境">
                  <Space direction="vertical" size="small">
                    <span>{getWeatherIcon(selectedTrack.weather)} {selectedTrack.weather}</span>
                    <span>🌡️ {selectedTrack.temperature}°C</span>
                    <span>💧 湿度 {selectedTrack.humidity}%</span>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="😊 跑步状态">
                  <Tag color={selectedTrack.feeling.includes('好') || selectedTrack.feeling.includes('PB') ? 'green' : 'gold'}>
                    {selectedTrack.feeling}
                  </Tag>
                  <div style={{ marginTop: 8 }}>难度: {selectedTrack.difficulty}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="💡 AI 点评">
                  {selectedTrack.distance > 8 ? '太厉害了！LSD长距离完成！记得好好恢复拉伸~ 💪' :
                   selectedTrack.distance > 5 ? '高质量完成！这个配速很棒，继续保持！✨' :
                   '轻松有氧跑完成！状态不错，继续加油哦~ 🌟'}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Track