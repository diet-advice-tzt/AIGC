/**
 * 百度千帆 API 工具函数（新版）
 *
 * ─── AI 对话（OpenAI 兼容接口）────────────────────────────────────────────────
 *   POST https://qianfan.gz.baidubce.com/v2/chat/completions
 *   Header: Authorization: Bearer <BAIDU_API_KEY>
 *   Body:   { model, messages, stream: false }
 *   响应:   data.choices[0].message.content
 *
 * ─── 图像生成 ──────────────────────────────────────────────────────────────────
 *   POST https://qianfan.baidubce.com/v2/images/generations
 *   Header: Authorization: Bearer <BAIDU_API_KEY>
 *   Body:   { model, prompt, n }
 *   响应:   data.data[0].url
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

  const resp = await axios.post(
    'https://qianfan.gz.baidubce.com/v2/chat/completions',
    {
      model,
      messages,
      stream: false,
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
}

/**
 * 百度千帆图像生成（同步接口，直接返回 URL）
 * @param {string} prompt 图片描述
 * @returns {Promise<string>} 图片 URL
 */
async function generateImage(prompt) {
  const apiKey = process.env.BAIDU_API_KEY
  const model = process.env.BAIDU_IMAGE_MODEL || 'flux-1-schnell'

  if (!apiKey) {
    throw new Error('百度千帆 API Key 未配置，请在 .env 中填写 BAIDU_API_KEY')
  }

  const resp = await axios.post(
    'https://qianfan.baidubce.com/v2/images/generations',
    {
      model,
      prompt,
      n: 1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000,
    }
  )

  const url = resp.data?.data?.[0]?.url
  if (!url) {
    throw new Error('百度千帆图像生成未返回 URL: ' + JSON.stringify(resp.data))
  }

  return url
}

// 保留旧函数签名以兼容已有路由调用
// picture.js 和 user.js 调用的是 submitImageTask + pollImageResult
// 这里统一改为直接调用 generateImage，pollImageResult 返回已有结果
async function submitImageTask(prompt) {
  // 新接口同步返回，taskId 就直接存 prompt，交给 pollImageResult 立刻执行
  return prompt
}

async function pollImageResult(taskIdOrPrompt) {
  return generateImage(taskIdOrPrompt)
}

module.exports = { chatWithErnie, generateImage, submitImageTask, pollImageResult }
