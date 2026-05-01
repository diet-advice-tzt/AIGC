// ─── Mock 数据集中管理 ────────────────────────────────────────────────────────
// 仅在后端不可用时作为 fallback 展示，真实接口优先

export const MOCK_USER = {
  id: '1',
  username: 'Demo',
  email: 'demo@race.app',
  avatar: '',
  sessionId: 'mock-session-001',
}

export const MOCK_TOKEN = 'mock-jwt-token'

// ── Chat ──────────────────────────────────────────────────────────────────────
export const MOCK_SESSIONS = [
  { sessionId: 'mock-s1', label: '运动计划咨询', createdAt: '2026-04-30T08:00:00Z' },
  { sessionId: 'mock-s2', label: '饮食营养建议', createdAt: '2026-04-29T20:00:00Z' },
]

export const MOCK_MESSAGES: Record<
  string,
  Array<{ id: string; content: string; role: 'user' | 'assistant'; time: string }>
> = {
  'mock-s1': [
    { id: '1', role: 'user', content: '我想制定一个每周跑步计划，目标是完成半程马拉松', time: '2026-04-30T08:01:00Z' },
    {
      id: '2', role: 'assistant',
      content: '很好的目标！以下是一个 12 周的半马训练计划建议：\n\n第 1-4 周（基础期）：每周跑 3 次，每次 5-8 公里，配速保持在轻松聊天的节奏。\n\n第 5-8 周（提升期）：加入一次长距离跑（10-14 公里），总量提升到每周 25-30 公里。\n\n第 9-12 周（赛前期）：增加间歇训练，最后两周逐渐减量，赛前一周轻松慢跑。\n\n记得每次跑步前做 5 分钟动态热身，跑后拉伸 10 分钟。你目前的跑步基础是什么水平？',
      time: '2026-04-30T08:01:30Z',
    },
    { id: '3', role: 'user', content: '我现在能跑 5 公里，配速大约 6 分 30 秒', time: '2026-04-30T08:02:00Z' },
    {
      id: '4', role: 'assistant',
      content: '6\'30" 的 5K 配速相当不错，已经具备了完成半马的基础！\n\n建议你的长跑配速比这慢 1-1.5 分钟，大概 7\'30"-8\'00" 完成长距离训练，这样能保证有氧基础的积累而不过度疲劳。\n\n另外每周步数要稳定在 8000 步以上，这对跑步能力提升也很有帮助。需要我帮你制定具体的每日步数目标吗？',
      time: '2026-04-30T08:02:45Z',
    },
  ],
  'mock-s2': [
    { id: '1', role: 'user', content: '跑步前后应该怎么吃？', time: '2026-04-29T20:05:00Z' },
    {
      id: '2', role: 'assistant',
      content: '跑步前后的饮食对表现和恢复都很关键：\n\n跑前 1-2 小时：轻量易消化的碳水，如香蕉、燕麦粥、全麦吐司。避免高脂高纤维食物，防止跑步中胃部不适。\n\n跑后 30 分钟内（黄金窗口期）：碳水 + 蛋白质的组合最佳，比例约 3:1。推荐：牛奶加麦片、鸡蛋三明治、酸奶加水果。\n\n补水：每跑 1 公里补充约 150-200ml 水，长跑（超过 1 小时）考虑运动饮料补充电解质。',
      time: '2026-04-29T20:06:00Z',
    },
  ],
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export const MOCK_DAILY_STEPS = {
  date: new Date().toISOString(),
  steps: 7832,
  rank: 3,
  aiEvaluation: '今天已走 7832 步，接近目标的 78%！晚饭后再散个步就能轻松完成 10000 步，继续加油 💪',
}

// ── Track ─────────────────────────────────────────────────────────────────────
export const MOCK_TRACK = {
  trackId: 'mock-track-20260430',
  totalDistance: 3240,
  points: [
    { latitude: 31.2304, longitude: 121.4737, time: '2026-04-30T07:00:00' },
    { latitude: 31.2312, longitude: 121.4745, time: '2026-04-30T07:02:00' },
    { latitude: 31.2325, longitude: 121.4756, time: '2026-04-30T07:04:00' },
    { latitude: 31.2338, longitude: 121.4762, time: '2026-04-30T07:06:00' },
    { latitude: 31.2350, longitude: 121.4758, time: '2026-04-30T07:08:00' },
    { latitude: 31.2361, longitude: 121.4748, time: '2026-04-30T07:10:00' },
    { latitude: 31.2370, longitude: 121.4735, time: '2026-04-30T07:12:00' },
    { latitude: 31.2375, longitude: 121.4720, time: '2026-04-30T07:14:00' },
    { latitude: 31.2368, longitude: 121.4708, time: '2026-04-30T07:16:00' },
    { latitude: 31.2355, longitude: 121.4700, time: '2026-04-30T07:18:00' },
    { latitude: 31.2342, longitude: 121.4705, time: '2026-04-30T07:20:00' },
    { latitude: 31.2330, longitude: 121.4715, time: '2026-04-30T07:22:00' },
    { latitude: 31.2318, longitude: 121.4725, time: '2026-04-30T07:24:00' },
    { latitude: 31.2308, longitude: 121.4733, time: '2026-04-30T07:26:00' },
    { latitude: 31.2304, longitude: 121.4737, time: '2026-04-30T07:28:00' },
  ],
}

// ── Image ─────────────────────────────────────────────────────────────────────
// 使用 picsum 占位图模拟已生成的图片
export const MOCK_IMAGES = [
  'https://picsum.photos/seed/running1/400/400',
  'https://picsum.photos/seed/sport2/400/400',
  'https://picsum.photos/seed/nature3/400/400',
]

// ── AI 回复模拟 ───────────────────────────────────────────────────────────────
const AI_REPLIES = [
  '这是个很好的问题！根据运动科学的研究，建议你在训练中保持心率在最大心率的 60%-80% 区间，这样既能有效提升有氧能力，又不会造成过度疲劳。',
  '建议采用 "80/20 训练法"：80% 的训练量保持轻松配速，20% 进行高强度间歇。这是目前精英跑者最常用的训练分配方式。',
  '恢复和训练同样重要！睡眠质量直接影响运动表现，建议每晚保证 7-8 小时睡眠，并在高强度训练后安排至少 48 小时的恢复期。',
  '保持良好的跑步姿势非常关键：上身微微前倾，落脚点在重心正下方，避免跨步过大，可以减少受伤风险，同时提升跑步经济性。',
  '补充维生素 D 和铁元素对跑者很有帮助，建议定期检查血液指标，根据结果适当补充。',
]

let replyIndex = 0
export const getMockAiReply = (question: string): string => {
  if (question.includes('步数') || question.includes('步')) {
    return '你今天的步数表现很好！步数是衡量日常活动量的重要指标，建议保持每天 8000-10000 步的目标。可以利用碎片时间增加步数，比如走楼梯、饭后散步等。'
  }
  if (question.includes('配速') || question.includes('跑') || question.includes('马拉松')) {
    return '关于跑步配速，建议循序渐进地提升。初期以能保持对话的配速为基准，每两周可以尝试提速 10-15 秒/公里。记住，有氧基础是一切速度训练的前提。'
  }
  if (question.includes('饮食') || question.includes('吃') || question.includes('营养')) {
    return '运动营养方面，全谷物、优质蛋白和大量蔬菜是核心。跑步前后 30 分钟内的补给尤为重要，碳水＋蛋白质的组合能显著加速恢复。'
  }
  const reply = AI_REPLIES[replyIndex % AI_REPLIES.length]
  replyIndex++
  return reply
}
