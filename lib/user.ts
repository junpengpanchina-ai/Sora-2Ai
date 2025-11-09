import { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 从 Supabase Auth User 对象中提取 Google ID
 * 尝试多种可能的字段位置
 */
export function getGoogleId(user: User): string {
  // 尝试从多个可能的位置获取 Google ID
  return (
    user.user_metadata?.provider_id ||
    user.user_metadata?.sub ||
    user.app_metadata?.provider_id ||
    user.id // 如果都没有，使用 Supabase 的 user.id 作为后备
  )
}

/**
 * 获取或创建用户记录
 * 如果用户不存在，会自动创建
 */
export async function getOrCreateUser(
  supabase: SupabaseClient,
  user: User
): Promise<{ id: string; credits: number } | null> {
  const googleId = getGoogleId(user)
  
  // 首先尝试获取现有用户
  const { data: userProfile, error: queryError } = await supabase
    .from('users')
    .select('id, credits')
    .eq('google_id', googleId)
    .single()

  // 如果用户存在，直接返回
  if (userProfile && !queryError) {
    return userProfile
  }

  // 如果用户不存在（错误码 PGRST116 表示未找到），创建新用户
  if (queryError?.code === 'PGRST116' || !userProfile) {
    const email = user.email || user.user_metadata?.email || ''
    const name = 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      user.user_metadata?.display_name || 
      null
    const avatarUrl = 
      user.user_metadata?.avatar_url || 
      user.user_metadata?.picture || 
      user.user_metadata?.avatar || 
      null

    // 创建新用户记录
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        google_id: googleId,
        email: email || `user_${googleId}@temp.com`, // 如果没有邮箱，使用临时邮箱
        name: name,
        avatar_url: avatarUrl,
        last_login_at: new Date().toISOString(),
        credits: 0, // 新用户默认 0 积分
      })
      .select('id, credits')
      .single()

    if (insertError || !newUser) {
      console.error('Failed to create user:', insertError)
      return null
    }

    return newUser
  }

  // 其他错误情况
  console.error('Failed to get user:', queryError)
  return null
}

