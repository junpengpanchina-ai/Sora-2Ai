/**
 * 频控逻辑
 * 控制 Veo 提示的显示频率，避免过度打扰用户
 */

const KEY = 'veo_hint_freq_v1'

type State = {
  lastDayKey?: string
  shownToday?: number
  lastShownSessionId?: string
  lastDismissedAt?: number
  lastDismissReason?: string
}

/**
 * 生成日期键（用于每日重置）
 */
function dayKey(ts = Date.now()): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * 从 localStorage 加载状态
 */
function load(): State {
  if (typeof window === 'undefined') {
    return {}
  }
  
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * 保存状态到 localStorage
 */
function save(s: State): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 忽略存储错误（如隐私模式）
  }
}

/**
 * 检查是否可以显示提示
 * 规则：
 * - 每天最多 2 次
 * - 每次会话最多 1 次
 * - 关闭后 24 小时内不再显示
 */
export function canShowHint(sessionId: string): boolean {
  const s = load()
  const dk = dayKey()

  // 如果日期变化，重置今日计数
  if (s.lastDayKey !== dk) {
    s.lastDayKey = dk
    s.shownToday = 0
  }

  // 24 小时冷却期（关闭后）
  if (s.lastDismissedAt && Date.now() - s.lastDismissedAt < 24 * 60 * 60 * 1000) {
    save(s)
    return false
  }

  // 每天最多 2 次
  if ((s.shownToday ?? 0) >= 2) {
    save(s)
    return false
  }

  // 每个会话最多 1 次
  if (s.lastShownSessionId === sessionId) {
    save(s)
    return false
  }

  save(s)
  return true
}

/**
 * 标记提示已显示
 */
export function markShown(sessionId: string): void {
  const s = load()
  const dk = dayKey()
  
  if (s.lastDayKey !== dk) {
    s.lastDayKey = dk
    s.shownToday = 0
  }
  
  s.shownToday = (s.shownToday ?? 0) + 1
  s.lastShownSessionId = sessionId
  save(s)
}

/**
 * 标记提示已关闭
 */
export function markDismiss(reason: string): void {
  const s = load()
  s.lastDismissedAt = Date.now()
  s.lastDismissReason = reason
  save(s)
}

/**
 * 获取当前状态（用于调试）
 */
export function getFrequencyState(): State {
  return load()
}

