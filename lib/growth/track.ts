/**
 * 埋点追踪
 * 先本地 log，后续可接入 PostHog/GA/自建后端
 */

export interface TrackEvent {
  name: string
  props: Record<string, unknown>
  timestamp?: number
}

/**
 * 追踪事件
 */
export function track(name: string, props: Record<string, unknown> = {}): void {
  const event: TrackEvent = {
    name,
    props,
    timestamp: Date.now(),
  }

  // 开发环境：输出到控制台
  if (process.env.NODE_ENV !== 'production') {
    console.log('[track]', name, props)
  }

  // 生产环境：发送到后端（可选）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // 异步发送，不阻塞主线程
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      keepalive: true, // 确保请求在页面卸载时也能发送
    }).catch(() => {
      // 静默失败，不影响用户体验
    })
  }
}

/**
 * 追踪页面浏览
 */
export function trackPageView(path: string, props: Record<string, unknown> = {}): void {
  track('page_view', {
    path,
    ...props,
  })
}

/**
 * 追踪用户行为
 */
export function trackUserAction(action: string, props: Record<string, unknown> = {}): void {
  track('user_action', {
    action,
    ...props,
  })
}

