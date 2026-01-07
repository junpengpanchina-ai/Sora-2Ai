// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseServerClient = SupabaseClient<Database>
type ModelType = 'sora-2' | 'veo-flash' | 'veo-pro'

/**
 * 检查用户是否有活跃的 Starter Pack
 */
export async function hasActiveStarterPack(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ hasPack: boolean; rechargeRecordId: string | null }> {
  try {
    const { data, error } = await supabase
      .from('recharge_records')
      .select('id')
      .eq('user_id', userId)
      .eq('is_starter_pack', true)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { hasPack: false, rechargeRecordId: null }
    }

    return { hasPack: true, rechargeRecordId: data.id }
  } catch (error) {
    console.error('Error checking starter pack:', error)
    return { hasPack: false, rechargeRecordId: null }
  }
}

/**
 * 检查用户今日是否超过限频（仅针对 Starter Pack 用户）
 */
export async function checkDailyLimit(
  supabase: SupabaseServerClient,
  userId: string,
  rechargeRecordId: string,
  modelType: ModelType
): Promise<{ allowed: boolean; currentCount: number; maxCount: number }> {
  // 非 Veo 模型不限制
  if (modelType === 'sora-2') {
    return { allowed: true, currentCount: 0, maxCount: Infinity }
  }

  // 确定最大次数
  const maxCount = modelType === 'veo-pro' ? 2 : 3 // Veo Pro: 2次/天, Veo Flash: 3次/天

  try {
    // 获取今日使用次数
    const { data, error } = await supabase
      .from('starter_pack_daily_limits')
      .select('veo_pro_count, veo_fast_count')
      .eq('user_id', userId)
      .eq('recharge_record_id', rechargeRecordId)
      .eq('date', new Date().toISOString().split('T')[0]) // 今天的日期
      .single()

    if (error || !data) {
      // 记录不存在，说明今天还没使用过，允许使用
      return { allowed: true, currentCount: 0, maxCount }
    }

    const currentCount = modelType === 'veo-pro' 
      ? (data.veo_pro_count || 0)
      : (data.veo_fast_count || 0)

    return {
      allowed: currentCount < maxCount,
      currentCount,
      maxCount,
    }
  } catch (error) {
    console.error('Error checking daily limit:', error)
    // 出错时允许使用（避免误拦截）
    return { allowed: true, currentCount: 0, maxCount }
  }
}

/**
 * 增加每日使用次数
 */
export async function incrementDailyLimit(
  supabase: SupabaseServerClient,
  userId: string,
  rechargeRecordId: string,
  modelType: ModelType
): Promise<{ success: boolean; error?: string }> {
  // 非 Veo 模型不需要记录
  if (modelType === 'sora-2') {
    return { success: true }
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    // 使用 upsert 来插入或更新记录
    const updateData: Record<string, unknown> = {
      user_id: userId,
      recharge_record_id: rechargeRecordId,
      date: today,
      updated_at: new Date().toISOString(),
    }

    if (modelType === 'veo-pro') {
      // 获取当前计数并加1
      const { data: existing } = await supabase
        .from('starter_pack_daily_limits')
        .select('veo_pro_count')
        .eq('user_id', userId)
        .eq('recharge_record_id', rechargeRecordId)
        .eq('date', today)
        .single()

      updateData.veo_pro_count = (existing?.veo_pro_count || 0) + 1
      updateData.veo_fast_count = existing?.veo_fast_count || 0
    } else {
      // veo-flash
      const { data: existing } = await supabase
        .from('starter_pack_daily_limits')
        .select('veo_fast_count')
        .eq('user_id', userId)
        .eq('recharge_record_id', rechargeRecordId)
        .eq('date', today)
        .single()

      updateData.veo_pro_count = existing?.veo_pro_count || 0
      updateData.veo_fast_count = (existing?.veo_fast_count || 0) + 1
    }

    const { error } = await supabase
      .from('starter_pack_daily_limits')
      .upsert(updateData, {
        onConflict: 'user_id,recharge_record_id,date',
      })

    if (error) {
      console.error('Failed to increment daily limit:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error incrementing daily limit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 记录 Veo Pro/Fast 使用日志（用于埋点）
 */
export async function logVeoUsage(
  supabase: SupabaseServerClient,
  userId: string,
  videoTaskId: string | null,
  modelType: 'veo-flash' | 'veo-pro',
  prompt: string,
  aspectRatio: string,
  consumptionRecordId: string | null,
  isFromStarterPack: boolean
): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    const { data, error } = await supabase
      .from('veo_pro_usage_logs')
      .insert({
        user_id: userId,
        video_task_id: videoTaskId,
        model_type: modelType,
        prompt: prompt.substring(0, 500), // 限制长度
        aspect_ratio: aspectRatio,
        status: 'pending',
        is_from_starter_pack: isFromStarterPack,
        consumption_record_id: consumptionRecordId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to log Veo usage:', error)
      return { success: false, error: error.message }
    }

    return { success: true, logId: data.id }
  } catch (error) {
    console.error('Error logging Veo usage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 更新 Veo 使用日志状态（成功/失败）
 */
export async function updateVeoUsageLog(
  supabase: SupabaseServerClient,
  logId: string,
  status: 'succeeded' | 'failed',
  failureReason?: string,
  retryCount?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      completed_at: new Date().toISOString(),
    }

    if (failureReason) {
      updateData.failure_reason = failureReason.substring(0, 500)
    }

    if (retryCount !== undefined) {
      updateData.retry_count = retryCount
    }

    const { error } = await supabase
      .from('veo_pro_usage_logs')
      .update(updateData)
      .eq('id', logId)

    if (error) {
      console.error('Failed to update Veo usage log:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating Veo usage log:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

