/**
 * 埋点追踪 API
 * 接收前端发送的追踪事件
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    // 验证事件格式
    if (!event.name || typeof event.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event: missing name' },
        { status: 400 }
      )
    }

    // 这里可以：
    // 1. 存储到数据库
    // 2. 发送到分析服务（PostHog, Mixpanel, etc.）
    // 3. 发送到自建后端

    // 目前先记录到日志（生产环境可以接入真实服务）
    if (process.env.NODE_ENV === 'production') {
      console.log('[track]', JSON.stringify(event))
      
      // 示例：发送到 PostHog（需要配置 POSTHOG_API_KEY）
      // if (process.env.POSTHOG_API_KEY) {
      //   await fetch('https://app.posthog.com/capture/', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       api_key: process.env.POSTHOG_API_KEY,
      //       event: event.name,
      //       properties: event.props,
      //       distinct_id: event.props.userId || 'anonymous',
      //     }),
      //   })
      // }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[track] Error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

