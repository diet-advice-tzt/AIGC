/**
 * AI API 工具函数
 *
 * ─── AI 对话（百度千帆 - OpenAI 兼容接口）──────────────────────────────────────
 *   POST https://qianfan.gz.baidubce.com/v2/chat/completions
 *   Header: Authorization: Bearer <BAIDU_API_KEY>
 *   Body:   { model, messages, stream: false }
 *   响应:   data.choices[0].message.content
 *
 * ─── 图像生成（阿里云 DashScope - 异步接口）─────────────────────────────────────
 *   第一步：POST /api/text2image/aigc/text-to-image
 *   响应:   { output: { task_id } }
 *   
 *   第二步：GET /api/text2image/tasks/{task_id}
 *   响应:   { output: { task_status, results: [{ url }] } }
 */

const axios = require('axios')

/**
 * 调用百度千帆 AI 对话（OpenAI 兼容接口）
 * @param {string} question  用户问题
 * @param {Array}  history   [{ role:'user'|'assistant', content:string }]
 * @returns {Promise<string>} AI 回复文本
 */
async function chatWithErnie(question, history = []) {
  const apiKey = process.env.BAIDU_API_KEY
  const model = process.env.BAIDU_CHAT_MODEL || 'deepseek-v3.1-250821'

  if (!apiKey) {
    throw new Error('百度千帆 API Key 未配置，请在 .env 中填写 BAIDU_API_KEY')
  }

  // 构建消息列表，带系统提示
  const messages = [
    { role: 'system', content: '你是一个专业的运动健身助手，擅长给出简洁实用的运动建议。' },
    ...history,
    { role: 'user', content: question },
  ]

  try {
    const resp = await axios.post(
      'https://qianfan.baidubce.com/v2/chat/completions',
      {
        model,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    )

    const content = resp.data?.choices?.[0]?.message?.content
    if (!content && content !== '') {
      throw new Error('百度千帆未返回有效内容: ' + JSON.stringify(resp.data))
    }

    return content
  } catch (err) {
    // 处理 429 错误（请求过多）
    if (err.response && err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after'] || '稍后'
      const errorMsg = err.response.data?.error?.message || '请求过于频繁'
      console.error(`[百度对话] 429 限流错误: ${errorMsg}, 建议${retryAfter}后重试`)
      console.error(`[百度对话] 完整响应:`, JSON.stringify(err.response.data))
      throw new Error(`请求过于频繁，请${retryAfter}后重试。错误: ${errorMsg}`)
    }
    
    // 处理其他错误
    console.error(`[百度对话] 请求失败:`, err.message)
    if (err.response) {
      console.error(`[百度对话] 状态码: ${err.response.status}, 响应:`, JSON.stringify(err.response.data))
    }
    throw err
  }
}

/**
 * 阿里云 DashScope 图像生成（同步接口）
 * 一次请求即可获得结果，推荐用于多数场景
 * @param {string} prompt 图片描述
 * @returns {Promise<string>} 图片 URL
 */
async function generateImage(prompt) {
  const apiKey = process.env.DASHSCOPE_API_KEY
  const model = process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-2.0-pro'
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'

  if (!apiKey) {
    throw new Error('阿里云 DashScope API Key 未配置，请在 .env 中填写 DASHSCOPE_API_KEY')
  }

  const requestUrl = `${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`

  try {
    console.log(`[DashScope] 图像生成，URL: ${requestUrl}`)
    console.log(`[DashScope] 模型: ${model}, 提示词: ${prompt.slice(0, 50)}...`)

    const resp = await axios.post(
      requestUrl,
      {
        model,
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        parameters: {
          negative_prompt: '低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感，构图混乱，文字模糊，扭曲',
          prompt_extend: true,
          watermark: false,
          size: '2048*2048',
          n: 1,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 120000, // 2分钟超时
      }
    )

    // 解析响应：output.choices[0].message.content[0].image
    const imageUrl = resp.data?.output?.choices?.[0]?.message?.content?.[0]?.image
    if (!imageUrl) {
      throw new Error('DashScope 未返回图片 URL: ' + JSON.stringify(resp.data))
    }

    console.log(`[DashScope] 图像生成成功，图片URL: ${imageUrl}`)
    return imageUrl
  } catch (err) {
    console.error(`[DashScope] 图像生成失败:`, err.message)
    if (err.response) {
      console.error(`[DashScope] 状态码: ${err.response.status}, 响应:`, JSON.stringify(err.response.data))
    }
    throw err
  }
}

// 保留旧函数签名以兼容已有路由调用
async function submitImageTask(prompt) {
  // 同步接口直接返回结果，这里返回空字符串占位
  return ''
}

async function pollImageResult(taskId) {
  // 同步接口不需要轮询，直接抛出错误（不应被调用）
  throw new Error('同步接口不支持轮询')
}

module.exports = { chatWithErnie, generateImage, submitImageTask, pollImageResult }
