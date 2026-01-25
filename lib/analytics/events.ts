// ============================================================
// Phase 2: 轻量埋点系统
// 不依赖 GA，用 Supabase 表或 console.log 即可
// ============================================================

import { createClient } from '@/lib/supabase/client'

// 6 个核心事件
export type EventName = 
  | 'home_view'                // 首页加载 - Phase 2D 入口基数
  | 'hero_generate_click'      // Hero 点 Generate - 首屏转化
  | 'example_click'            // 点 Example 卡 - 学习成本
  | 'video_page_enter'         // 进 /video - 意图确认
  | 'generation_started'       // 调 API - 使用开始
  | 'generation_success'       // 成功 - 产品价值
  | 'generation_failed'        // 失败 - 问题追踪
  | 'pricing_click'            // 看价格 - 付费意图
  | 'download_click'           // 下载视频 - 价值感知
  | 'generate_another_click'   // 再生成一个 - 粘性

interface EventPayload {
  name: EventName
  userId?: string
  meta?: Record<string, unknown>
}

// 是否启用 Supabase 埋点（如果表不存在则只打 console）
const ENABLE_SUPABASE_EVENTS = true

const getAnonId = () => {
  if (typeof window === 'undefined') return null
  try {
    const key = 'sora2ai_anon_id'
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const created = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(key, created)
    return created
  } catch {
    return null
  }
}

/**
 * 打点函数
 * - 开发环境：console.log
 * - 生产环境：写入 Supabase events 表（可选）
 */
export async function trackEvent({ name, userId, meta }: EventPayload) {
  const timestamp = new Date().toISOString()
  
  // 开发环境始终打印
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Event] ${name}`, { userId, meta, timestamp })
  }
  
  // 如果启用 Supabase 埋点
  if (ENABLE_SUPABASE_EVENTS && typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      // NOTE: This repo's typed Supabase client may not include the `events` table
      // in its generated Database types, which causes `insert()` to infer `never`.
      // Cast to `any` to avoid blocking builds; runtime is still safe.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('events').insert({
        name,
        user_id: userId || null,
        meta: { ...(meta || {}), anonId: getAnonId() },
        created_at: timestamp,
      })
    } catch (error) {
      // 静默失败，不影响用户体验
      console.debug('[Event] Failed to track:', error)
    }
  }
}

// ============================================================
// 便捷函数
// ============================================================

export const Events = {
  // 首页加载
  homeView: (userId?: string) =>
    trackEvent({
      name: 'home_view',
      userId,
    }),

  // 首屏转化
  heroGenerateClick: (userId?: string, prompt?: string) => 
    trackEvent({ 
      name: 'hero_generate_click', 
      userId,
      meta: { promptLength: prompt?.length || 0 }
    }),
  
  // Example 点击
  exampleClick: (userId?: string, exampleTitle?: string) => 
    trackEvent({ 
      name: 'example_click', 
      userId,
      meta: { exampleTitle }
    }),
  
  // 进入 /video 页
  videoPageEnter: (userId?: string, fromHero?: boolean) => 
    trackEvent({ 
      name: 'video_page_enter', 
      userId,
      meta: { fromHero }
    }),
  
  // 开始生成
  generationStarted: (userId?: string, model?: string) => 
    trackEvent({ 
      name: 'generation_started', 
      userId,
      meta: { model }
    }),
  
  // 生成成功
  generationSuccess: (userId?: string, model?: string, durationMs?: number) => 
    trackEvent({ 
      name: 'generation_success', 
      userId,
      meta: { model, durationMs }
    }),
  
  // 生成失败
  generationFailed: (userId?: string, error?: string) => 
    trackEvent({ 
      name: 'generation_failed', 
      userId,
      meta: { error }
    }),
  
  // 点击 Pricing
  pricingClick: (userId?: string, from?: string) => 
    trackEvent({ 
      name: 'pricing_click', 
      userId,
      meta: { from }
    }),
  
  // 下载视频
  downloadClick: (userId?: string) => 
    trackEvent({ 
      name: 'download_click', 
      userId,
    }),
  
  // 再生成一个
  generateAnotherClick: (userId?: string) => 
    trackEvent({ 
      name: 'generate_another_click', 
      userId,
    }),
}

// ============================================================
// SQL: 创建 events 表（如果需要）
// ============================================================
/*
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  user_id uuid references auth.users(id),
  meta jsonb,
  created_at timestamptz default now()
);

-- 索引
create index idx_events_name on events(name);
create index idx_events_user_id on events(user_id);
create index idx_events_created_at on events(created_at);

-- RLS（如果需要）
alter table events enable row level security;
create policy "Users can insert their own events" on events
  for insert with check (auth.uid() = user_id or user_id is null);
*/
