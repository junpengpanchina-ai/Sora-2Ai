// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { addWelcomeBonus } from '@/lib/credits'

/**
 * 从 Supabase Auth User 对象中提取 Google ID
 * 尝试多种可能的字段位置
 */
export function getGoogleId(user: User): string {
  // 尝试从多个可能的位置获取 Google ID
  // 优先级：provider_id > sub > app_metadata.provider_id > user.id
  const googleId = 
    user.user_metadata?.provider_id ||
    user.user_metadata?.sub ||
    user.app_metadata?.provider_id ||
    user.id // 如果都没有，使用 Supabase 的 user.id 作为后备
  
  // 确保返回的是字符串
  return String(googleId || user.id)
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
  
  console.log('[getOrCreateUser] Attempting to get/create user:', {
    googleId,
    userId: user.id,
    email: user.email,
    userMetadata: user.user_metadata,
  })
  
  // 首先尝试获取现有用户
  // 先尝试查询包含 credits 字段
  const { data: userProfile, error: queryError } = await supabase
    .from('users')
    .select('id, credits')
    .eq('google_id', googleId)
    .single()

  // 如果查询失败且可能是 credits 字段不存在，尝试只查询 id
  if (queryError && queryError.code !== 'PGRST116') {
    console.log('[getOrCreateUser] Query with credits failed, trying without credits field:', queryError.message)
    const { data: userWithoutCredits, error: simpleQueryError } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', googleId)
      .single()
    
    if (userWithoutCredits && !simpleQueryError) {
      console.log('[getOrCreateUser] User found without credits field, using default 0')
      return {
        id: userWithoutCredits.id,
        credits: 0 // 如果 credits 字段不存在，使用默认值 0
      }
    }
  }

  // 如果用户存在，直接返回（确保 credits 有默认值）
  if (userProfile && !queryError) {
    console.log('[getOrCreateUser] User found:', userProfile.id, 'credits:', userProfile.credits)
    // 确保 credits 字段存在，如果为 null 则使用 0
    return {
      id: userProfile.id,
      credits: userProfile.credits ?? 0
    }
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

    // 确保邮箱不为空，如果为空则使用基于 google_id 的唯一邮箱
    let finalEmail = email.trim()
    if (!finalEmail || finalEmail === '') {
      // 使用基于 google_id 的唯一邮箱，避免冲突
      const safeGoogleId = String(googleId).replace(/[^a-zA-Z0-9]/g, '_')
      finalEmail = `user_${safeGoogleId}@temp.local`
    }

    console.log('[getOrCreateUser] Creating new user:', {
      googleId,
      email: finalEmail,
      name,
      hasEmail: !!email,
    })

    // 先检查邮箱是否已存在（但 google_id 不同）
    if (email && email.trim() !== '') {
      const { data: existingEmailUser, error: emailCheckError } = await supabase
        .from('users')
        .select('id, google_id, credits')
        .eq('email', email.trim())
        .single()
      
      if (existingEmailUser && !emailCheckError) {
        // 如果邮箱已存在但 google_id 不同，更新 google_id
        if (existingEmailUser.google_id !== googleId) {
          console.log('[getOrCreateUser] Email exists with different google_id, updating...')
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              google_id: googleId,
              last_login_at: new Date().toISOString(),
            })
            .eq('id', existingEmailUser.id)
          
          if (!updateError) {
            return { id: existingEmailUser.id, credits: existingEmailUser.credits }
          }
        } else {
          // google_id 也匹配，直接返回
          console.log('[getOrCreateUser] Found existing user by email:', existingEmailUser.id)
          return { id: existingEmailUser.id, credits: existingEmailUser.credits }
        }
      }
    }

    // 创建新用户记录
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        google_id: googleId,
        email: finalEmail,
        name: name,
        avatar_url: avatarUrl,
        last_login_at: new Date().toISOString(),
        credits: 0, // 新用户默认 0 积分
      })
      .select('id, credits')
      .single()

    if (insertError) {
      console.error('[getOrCreateUser] Failed to create user:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        googleId,
        email: finalEmail,
      })
      
      // 如果是唯一性约束冲突（邮箱或 google_id 已存在），尝试再次查询
      if (insertError.code === '23505') {
        console.log('[getOrCreateUser] Unique constraint violation, retrying query...')
        
        // 先尝试通过 google_id 查找
        const { data: existingUser, error: retryError } = await supabase
          .from('users')
          .select('id, credits')
          .eq('google_id', googleId)
          .single()
        
        if (existingUser && !retryError) {
          console.log('[getOrCreateUser] Found existing user after conflict:', existingUser.id)
          return existingUser
        }
        
        // 如果 google_id 查询失败，尝试通过邮箱查找
        if (finalEmail && finalEmail.includes('@')) {
          console.log('[getOrCreateUser] Trying to find user by email...')
          const { data: emailUser, error: emailError } = await supabase
            .from('users')
            .select('id, credits')
            .eq('email', finalEmail)
            .single()
          
          if (emailUser && !emailError) {
            // 更新该用户的 google_id
            console.log('[getOrCreateUser] Found user by email, updating google_id...')
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                google_id: googleId,
                last_login_at: new Date().toISOString(),
              })
              .eq('id', emailUser.id)
            
            if (!updateError) {
              return emailUser
            }
          }
        }
      }
      
      return null
    }

    if (!newUser) {
      console.error('[getOrCreateUser] User creation returned no data')
      return null
    }

    console.log('[getOrCreateUser] User created successfully:', newUser.id)
    
    // 给新用户赠送欢迎积分（30积分 = 3美金 = 3次视频生成机会，每次生成消耗10积分，1美金 = 10积分）
    const welcomeBonusResult = await addWelcomeBonus(supabase, newUser.id)
    if (welcomeBonusResult.success) {
      console.log('[getOrCreateUser] Welcome bonus added successfully:', welcomeBonusResult.rechargeRecordId)
      // 更新返回的积分值
      newUser.credits = (newUser.credits || 0) + 30
    } else {
      console.error('[getOrCreateUser] Failed to add welcome bonus:', welcomeBonusResult.error)
      // 即使赠送失败，也返回用户信息（积分为0）
    }
    
    return newUser
  }

  // 其他错误情况
  console.error('[getOrCreateUser] Failed to get user:', {
    error: queryError,
    code: queryError?.code,
    message: queryError?.message,
  })
  return null
}

