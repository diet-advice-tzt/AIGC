import React, { useState } from 'react'
import { Input, Button, Card, List, Image, Spin, message, Empty } from 'antd'
import { PictureOutlined, SendOutlined } from '@ant-design/icons'
import { imageApi } from '../api'

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入图片描述')
      return
    }

    setLoading(true)
    try {
      const res: any = await imageApi.generate({ prompt })
      if (res.code === 1 && res.data?.imageUrl) {
        setImages((prev) => [res.data.imageUrl, ...prev])
        message.success('图片生成成功')
        setPrompt('')
      } else {
        message.error(res.msg || '生成失败')
      }
    } catch (error) {
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="🎨 AI 图片生成" extra={<span>输入描述，AI 将为您创作图片</span>}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="描述您想要生成的图片，例如：一只可爱的猫咪在樱花树下..."
            size="large"
            disabled={loading}
            prefix={<PictureOutlined />}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleGenerate}
            size="large"
          >
            生成图片
          </Button>
        </div>
      </Card>

      <Card title="🖼️ 已生成的图片">
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>AI 正在创作中...</p>
          </div>
        )}

        {images.length === 0 && !loading && (
          <Empty description="还没有生成的图片，快来试试吧！" />
        )}

        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={images}
          renderItem={(url) => (
            <List.Item>
              <div className="image-item">
                <Image src={url} alt="Generated" fallback="https://picsum.photos/400/300" />
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default ImageGenerator