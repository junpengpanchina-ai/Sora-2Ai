'use server'

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function createServiceClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('缺少 Supabase 服务端配置，请设置 NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('缺少 SUPABASE_SERVICE_ROLE_KEY，请在 .env.local 与部署环境中配置 Supabase Service Role Key')
  }

  if (anonKey && serviceRoleKey === anonKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 不能与 NEXT_PUBLIC_SUPABASE_ANON_KEY 相同，请复制 Supabase 项目的 Service Role Key'
    )
  }

  // 🔥 优化连接配置，提高构建时的稳定性
  // 注意：不要完全覆盖 fetch，让 Supabase 客户端自己处理 API key
  // 我们只添加超时和连接优化
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // 🔥 添加全局配置，优化网络连接
    global: {
      headers: {
        'Connection': 'keep-alive',
      },
      // 增加超时时间，但不覆盖 Supabase 的 API key 处理
      fetch: async (input, init) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 秒超时
        
        try {
          // 保留原始 headers，只添加 Connection header
          const headers = new Headers(init?.headers)
          headers.set('Connection', 'keep-alive')
          
          const response = await fetch(input, {
            ...init,
            signal: controller.signal,
            headers,
          })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
    },
  })
}


