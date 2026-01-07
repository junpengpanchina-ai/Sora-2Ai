/**
 * Veo 提示触发点评分逻辑
 * 根据用户行为和上下文决定是否显示 Veo Pro 提示
 */

export type Reason =
  | 'QUALITY_MATCH'
  | 'HIGH_ENGAGEMENT'
  | 'FRICTION'
  | 'HIGH_INTENT_ACTION'
  | 'STARTER_LIMIT_APPROACH'
  | 'NONE'

export type UserPlan = 'free' | 'starter' | 'pro'

export interface VeoIntentInput {
  userPlan: UserPlan
  hasVeoAccess: boolean

  // 使用统计
  soraGenerations7d: number
  soraGenerationsSession: number

  // 生成结果
  lastGenSucceeded: boolean
  queueOrSlow: boolean

  // 用户行为
  timeOnResultSec: number
  didDownloadOrShare: boolean

  // 内容提示
  contentHints?: {
    wantsAudio?: boolean
    wantsHighFidelity?: boolean
    wantsFirstLastFrame?: boolean
  }

  // Starter 配额（7 天）
  starterQuota7d?: number
}

export interface VeoIntentDecision {
  score: number
  show: boolean
  reason: Reason
}

/**
 * 决定是否显示 Veo 提示
 * 
 * 评分规则：
 * - Quality match: +3 (音频), +2 (高保真), +2 (首尾帧)
 * - Usage maturity: +2 (会话内 2+ 次), +2 (7 天内 5+ 次)
 * - Engagement: +2 (观看 15+ 秒), +1 (观看 35+ 秒)
 * - Friction: +2 (失败), +2 (队列/慢)
 * - High-intent: +3 (下载/分享)
 * - Starter limit: +2 (接近配额 60%)
 * 
 * 显示阈值：score >= 6
 */
export function decideVeoHint(input: VeoIntentInput): VeoIntentDecision {
  // 如果已有 Veo 访问或 Pro 用户，不显示
  if (input.hasVeoAccess || input.userPlan === 'pro') {
    return { score: 0, show: false, reason: 'NONE' }
  }

  let score = 0
  const h = input.contentHints ?? {}

  // Quality match（质量匹配）
  if (h.wantsAudio) score += 3
  if (h.wantsHighFidelity) score += 2
  if (h.wantsFirstLastFrame) score += 2

  // Usage maturity（使用成熟度）
  if (input.soraGenerationsSession >= 2) score += 2
  if (input.soraGenerations7d >= 5) score += 2

  // Engagement（参与度）
  if (input.timeOnResultSec >= 15) score += 2
  if (input.timeOnResultSec >= 35) score += 1

  // Friction（摩擦点）
  if (!input.lastGenSucceeded) score += 2
  if (input.queueOrSlow) score += 2

  // High-intent action（高意图行为）
  if (input.didDownloadOrShare) score += 3

  // Starter limit approach（接近 Starter 限制）
  const quota = input.starterQuota7d ?? 15
  if (input.userPlan === 'starter' && input.soraGenerations7d >= Math.ceil(quota * 0.6)) {
    score += 2
  }

  const show = score >= 6

  if (!show) {
    return { score, show, reason: 'NONE' }
  }

  // 确定原因（优先级顺序）
  let reason: Reason = 'HIGH_ENGAGEMENT'

  if (h.wantsAudio || h.wantsHighFidelity || h.wantsFirstLastFrame) {
    reason = 'QUALITY_MATCH'
  } else if (input.didDownloadOrShare) {
    reason = 'HIGH_INTENT_ACTION'
  } else if (!input.lastGenSucceeded || input.queueOrSlow) {
    reason = 'FRICTION'
  } else if (input.userPlan === 'starter') {
    reason = 'STARTER_LIMIT_APPROACH'
  }

  return { score, show, reason }
}

