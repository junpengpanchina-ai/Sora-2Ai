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

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}


