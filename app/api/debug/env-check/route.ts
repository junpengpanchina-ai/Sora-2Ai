import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function safePrefix(v: string | undefined, n: number) {
  if (!v) return null
  return v.length <= n ? v : `${v.slice(0, n)}...`
}

/**
 * GET /api/debug/env-check
 * 仅用于在生产环境确认运行时环境变量是否注入（不泄露敏感值）
 */
export async function GET() {
  const adminUser = await validateAdminSession()
  if (!adminUser) {
    return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    vercel: {
      VERCEL_ENV: process.env.VERCEL_ENV || null,
      VERCEL_URL: process.env.VERCEL_URL || null,
      VERCEL_GIT_COMMIT_SHA: safePrefix(process.env.VERCEL_GIT_COMMIT_SHA, 10),
      VERCEL_DEPLOYMENT_ID: safePrefix(process.env.VERCEL_DEPLOYMENT_ID, 12),
    },
    env: {
      NEXT_PUBLIC_SITE_URL: safePrefix(process.env.NEXT_PUBLIC_SITE_URL, 64),
      NEXT_PUBLIC_APP_URL: safePrefix(process.env.NEXT_PUBLIC_APP_URL, 64),
      BATCH_CRON_SECRET: !!process.env.BATCH_CRON_SECRET,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    },
    supabase: {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey,
      hasServiceRoleKey: !!serviceKey,
      urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
      anonKeyPrefix: safePrefix(anonKey, 16), // anon key is public, safe to show prefix
      // service role key is sensitive: never return prefix
      serviceRoleKeyLength: serviceKey ? serviceKey.length : null,
    },
  })
}


