// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import crypto from 'crypto'

type SupabaseServerClient = SupabaseClient<Database>
type ModelType = 'sora-2' | 'veo-flash' | 'veo-pro'

/**
 * 检查用户是否有活跃的 Starter Access
 */
export async function hasActiveStarterAccess(
  supabase: SupabaseServerClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_usage_stats')
      .select('starter_access_expires_at')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return false
    }

    if (!data.starter_access_expires_at) {
      return false
    }

    const expiresAt = new Date(data.starter_access_expires_at)
    return expiresAt > new Date()
  } catch (error) {
    console.error('Error checking starter access:', error)
    return false
  }
}

/**
 * 检查用户是否可以使用 Veo（Starter Access 期间禁止）
 */
export async function canUseVeo(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string; message?: string }> {
  try {
    // 检查是否有活跃的 Starter Access
    const hasAccess = await hasActiveStarterAccess(supabase, userId)
    
    if (hasAccess) {
      return {
        allowed: false,
        reason: 'starter_access_veo_blocked',
        message: 'Veo is not available during Starter Access. Please wait until access expires or upgrade to a full pack.',
      }
    }

    // 检查风险标志
    const { data: riskFlag } = await supabase
      .from('risk_flags')
      .select('starter_abuse, abnormal_usage')
      .eq('user_id', userId)
      .single()

    if (riskFlag && (riskFlag.starter_abuse || riskFlag.abnormal_usage)) {
      return {
        allowed: false,
        reason: 'risk_flag',
        message: 'Account flagged for suspicious activity. Please contact support.',
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking Veo access:', error)
    return { allowed: true } // 出错时允许使用，避免误拦截
  }
}

/**
 * 检查 Starter Access 限制
 */
export async function checkStarterAccessLimits(
  supabase: SupabaseServerClient,
  userId: string,
  modelType: ModelType
): Promise<{
  allowed: boolean
  reason?: string
  message?: string
  remaining?: number
  expiresAt?: string
}> {
  try {
    // 检查是否有活跃的 Starter Access
    const { data: stats } = await supabase
      .from('user_usage_stats')
      .select('starter_access_expires_at, sora_generations_7d')
      .eq('user_id', userId)
      .single()

    if (!stats) {
      return { allowed: true, reason: 'no_starter_access' }
    }

    const hasAccess = stats.starter_access_expires_at && 
      new Date(stats.starter_access_expires_at) > new Date()

    // 如果没有 Starter Access，允许使用
    if (!hasAccess) {
      return { allowed: true, reason: 'no_starter_access' }
    }

    // Starter Access 期间禁止 Veo Pro（但允许 Veo Flash）
    if (modelType === 'veo-pro') {
      return {
        allowed: false,
        reason: 'starter_access_veo_blocked',
        message: `Veo is not available during Starter Access. Access expires at ${new Date(stats.starter_access_expires_at).toLocaleString()}.`,
        expiresAt: stats.starter_access_expires_at,
      }
    }

    // 检查 Sora 使用限制（≤ 15 次 / 7 天）
    const soraCount7d = stats.sora_generations_7d || 0
    
    if (soraCount7d >= 15) {
      return {
        allowed: false,
        reason: 'starter_access_limit_reached',
        message: `Starter Access limit reached (15 Sora generations per 7 days). Access expires at ${new Date(stats.starter_access_expires_at).toLocaleString()}.`,
        expiresAt: stats.starter_access_expires_at,
      }
    }

    return {
      allowed: true,
      reason: 'within_limits',
      remaining: 15 - soraCount7d,
      expiresAt: stats.starter_access_expires_at,
    }
  } catch (error) {
    console.error('Error checking starter access limits:', error)
    return { allowed: true } // 出错时允许使用
  }
}

/**
 * 设置 Starter Access（7 天）
 */
export async function setStarterAccess(
  supabase: SupabaseServerClient,
  userId: string,
  days: number = 7
): Promise<{ success: boolean; error?: string }> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    const { error } = await supabase
      .from('user_usage_stats')
      .upsert({
        user_id: userId,
        starter_access_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Failed to set starter access:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting starter access:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 记录生成日志（用于风控）
 */
export async function logGeneration(
  supabase: SupabaseServerClient,
  userId: string,
  modelType: ModelType,
  creditsUsed: number,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  videoTaskId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 哈希 IP 地址（保护隐私）
    const ipHash = crypto
      .createHash('sha256')
      .update(ipAddress)
      .digest('hex')
      .substring(0, 16)

    const { error } = await supabase
      .from('generation_logs')
      .insert({
        user_id: userId,
        model: modelType,
        credits_used: creditsUsed,
        success: success,
        ip_hash: ipHash,
        user_agent: userAgent,
        video_task_id: videoTaskId || null,
      })

    if (error) {
      console.error('Failed to log generation:', error)
      return { success: false, error: error.message }
    }

    // 更新使用统计
    await updateUsageStats(supabase, userId, modelType)

    return { success: true }
  } catch (error) {
    console.error('Error logging generation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 更新使用统计
 */
async function updateUsageStats(
  supabase: SupabaseServerClient,
  userId: string,
  modelType: ModelType
): Promise<void> {
  try {
  const isSora = modelType === 'sora-2'
  const isVeoFlash = modelType === 'veo-flash'
  const isVeoPro = modelType === 'veo-pro'
  // const isVeo = isVeoFlash || isVeoPro // Unused for now

    // 获取当前统计
    const { data: current } = await supabase
      .from('user_usage_stats')
      .select('sora_generations_total, veo_generations_total, sora_generations_7d, veo_generations_7d, updated_at')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // 如果上次更新超过 7 天，重置 7 天计数
    const shouldReset7d = !current?.updated_at || 
      new Date(current.updated_at) < sevenDaysAgo

    const updateData: Record<string, unknown> = {
      updated_at: now.toISOString(),
    }

    if (isSora) {
      updateData.sora_generations_total = (current?.sora_generations_total || 0) + 1
      updateData.sora_generations_7d = shouldReset7d ? 1 : (current?.sora_generations_7d || 0) + 1
    }

    if (isVeoFlash) {
      updateData.veo_generations_total = (current?.veo_generations_total || 0) + 1
      updateData.veo_generations_7d = shouldReset7d ? 1 : (current?.veo_generations_7d || 0) + 1
    }

    if (isVeoPro) {
      updateData.veo_generations_total = (current?.veo_generations_total || 0) + 1
      updateData.veo_generations_7d = shouldReset7d ? 1 : (current?.veo_generations_7d || 0) + 1
    }

    await supabase
      .from('user_usage_stats')
      .upsert({
        user_id: userId,
        ...updateData,
      }, {
        onConflict: 'user_id',
      })
  } catch (error) {
    console.error('Error updating usage stats:', error)
  }
}

/**
 * 检查同 IP 多账号风险
 */
export async function checkMultiAccountRisk(
  supabase: SupabaseServerClient,
  ipAddress: string,
  threshold: number = 3
): Promise<{ isRisk: boolean; accountCount: number }> {
  try {
    const ipHash = crypto
      .createHash('sha256')
      .update(ipAddress)
      .digest('hex')
      .substring(0, 16)

    const { data, error } = await supabase
      .from('generation_logs')
      .select('user_id', { count: 'exact' })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error checking multi-account risk:', error)
      return { isRisk: false, accountCount: 0 }
    }

    const uniqueUsers = new Set(data?.map((log: { user_id: string }) => log.user_id) || [])
    const accountCount = uniqueUsers.size

    return {
      isRisk: accountCount >= threshold,
      accountCount,
    }
  } catch (error) {
    console.error('Error checking multi-account risk:', error)
    return { isRisk: false, accountCount: 0 }
  }
}

