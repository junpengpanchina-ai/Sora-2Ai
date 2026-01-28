'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics/events'
import { HERO_EXAMPLES } from '@/lib/examples'

// ============================================================
// Phase 2A: A/B Copy Variants
// 用 ?hero=b 切换版本，默认为 A
// ============================================================

const HERO_COPY = {
  // 版本 A：强调"快 & 简单"
  a: {
    h1: 'Create cinematic videos from a single prompt.',
    subtitle: 'No subscriptions. Just prepaid credits. From prompt to video in minutes.',
  },
  // 版本 B：强调"专业 & 可控"
  b: {
    h1: 'Turn prompts into production-ready videos.',
    subtitle: 'Reliable video generation with Sora-2. Prepaid credits. No hidden costs.',
  },
}

// 信任锚点文案（轻量）
const TRUST_ANCHOR = 'Used by creators, marketers, and indie teams worldwide.'

interface HeroV2Props {
  isLoggedIn?: boolean
  onGenerate?: (prompt: string) => void
}

export default function HeroV2({ isLoggedIn = false, onGenerate }: HeroV2Props) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [showTips, setShowTips] = useState(false)

  // A/B 文案切换（避免 hydration mismatch）：
  // - 首次渲染永远用 A（服务端/客户端一致）
  // - 挂载后再读取 URL 决定是否切到 B
  const [heroVariant, setHeroVariant] = useState<'a' | 'b'>('a')
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      setHeroVariant(url.searchParams.get('hero') === 'b' ? 'b' : 'a')
    } catch {
      setHeroVariant('a')
    }
  }, [])
  const copy = HERO_COPY[heroVariant]

  // Phase 2：10 秒新手引导（不弹窗、不遮挡、不打断，只出现一次）
  useEffect(() => {
    const key = 'sora2_show_tips_v1'
    try {
      const v = window.localStorage.getItem(key)
      if (!v) {
        setShowTips(true)
        window.localStorage.setItem(key, '1')
        const t = window.setTimeout(() => setShowTips(false), 10_000)
        return () => window.clearTimeout(t)
      }
    } catch {
      // ignore (privacy mode etc.)
    }
  }, [])

  const handleExampleClick = (examplePrompt: string, exampleId: string) => {
    setPrompt(examplePrompt)
    inputRef.current?.focus()

    // 轻量埋点：记录 Example 点击（用于后续榜单）
    try {
      const payload = JSON.stringify({
        event: 'example_click',
        source: 'home_hero',
        example_id: exampleId,
      })
      if (navigator?.sendBeacon) {
        navigator.sendBeacon(
          '/api/events',
          new Blob([payload], { type: 'application/json' })
        )
      } else {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // ignore
    }

    // 现有 Phase 2 埋点（保留）
    Events.exampleClick(undefined, exampleId)
  }

  const handleGenerate = () => {
    if (!prompt.trim()) return
    // Phase 2 埋点
    Events.heroGenerateClick(undefined, prompt)
    
    if (onGenerate) {
      onGenerate(prompt)
    } else {
      // 默认行为：跳转到生成页面
      window.location.href = `/video?prompt=${encodeURIComponent(prompt)}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && prompt.trim()) {
      handleGenerate()
    }
  }

  const heroExamples = HERO_EXAMPLES.filter((x) => x.heroSlot === 'hero').slice(0, 4)

  return (
    <section className="relative min-h-[90vh] flex items-center" suppressHydrationWarning>
      {/* 简洁深色背景 */}
      <div className="absolute inset-0 bg-[var(--bg)]" />
      
      {/* 微妙的渐变装饰 */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(32, 128, 255, 0.15), transparent)'
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          
          {/* Left: Sell */}
          <div className="animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs border-[var(--border)] bg-[var(--surface)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[var(--muted)]">NEW • Sora-2 + Veo Fast/Pro</span>
            </div>

            {/* H1 - A/B 文案 */}
            <h1 className="mt-5 text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-[var(--text)] leading-[1.1]">
              {copy.h1}
            </h1>

            {/* Subtitle - A/B 文案 */}
            <p className="mt-4 text-base md:text-lg text-[var(--muted)] max-w-lg">
              {copy.subtitle}
            </p>

            {/* 证据条 */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {[
                "No watermark (Sora-2)", 
                "Fast queue + reliable retries", 
                "Prepaid credits only"
              ].map((t) => (
                <li 
                  key={t} 
                  className="rounded-full border px-3 py-1.5 text-xs text-[var(--muted)] border-[var(--border)] bg-[var(--surface)]"
                >
                  {t}
                </li>
              ))}
            </ul>

            {/* 信任锚点（轻量）*/}
            <p className="mt-4 text-sm text-[var(--muted)] opacity-70">
              {TRUST_ANCHOR}
            </p>

            {/* 轻量 Recent activity（系统感 × 社交感） */}
            <div className="recentline">
              <span className="recentpill">Live</span>
              <span className="recenttext">Someone just generated “Skincare demo ad”</span>
              <span className="recentmuted">· 2 min ago</span>
            </div>

            {/* 输入区域 */}
            <div className="mt-8">
              <div className="card p-4">
                <label className="block text-xs mb-2 text-[var(--muted)] font-medium">
                  Your prompt
                </label>
                {showTips && (
                  <p className="mb-2 text-xs text-[var(--muted)] opacity-70">
                    Tip: Click an example on the right to start fast.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    className="input flex-1"
                    placeholder='e.g., "A neon-lit cyberpunk street in the rain, cinematic, slow dolly, 4K"'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  {isLoggedIn ? (
                    <button 
                      className="btn btn-primary whitespace-nowrap"
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                    >
                      Generate
                    </button>
                  ) : (
                    <Link href={`/login?redirect=${encodeURIComponent(`/video?prompt=${prompt}`)}`}>
                      <button className="btn btn-primary whitespace-nowrap">
                        Generate
                      </button>
                    </Link>
                  )}
                </div>
                
                {/* 次要操作 */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/video">
                    <button className="btn btn-secondary btn-sm">
                      Upload image
                    </button>
                  </Link>
                  <Link href="#pricing-plans" onClick={() => Events.pricingClick(undefined, 'hero')}>
                    <button className="btn btn-ghost btn-sm">
                      See pricing
                    </button>
                  </Link>
                </div>

                {/* 轻量保险话术：降低第一次使用的心理摩擦 */}
                <p className="mt-3 text-xs text-[var(--muted)] opacity-70">
                  {showTips ? (
                    <>You&apos;ll see progress immediately. Failed generations are refunded automatically.</>
                  ) : (
                    <>You&apos;ll see progress and can retry if it fails — credits are refunded automatically.</>
                  )}
                </p>
              </div>

              {/* 合规小字 */}
              <p className="mt-3 text-xs text-[var(--muted)] opacity-80">
                By generating, you agree to the{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-[var(--text)]">
                  Terms
                </Link>
                . We don&apos;t promise rankings — we ship reliable infrastructure.
              </p>
            </div>
          </div>

          {/* Right: Show (Examples) */}
          <div className="animate-fade-up hero-right" style={{ animationDelay: '100ms' }}>
            <div className="hero-right-head mb-3">
              <div className="hero-right-title">
                Start with an example <span className="text-[var(--muted)]">(recommended)</span>
              </div>
              <div className="hero-right-sub">
                Click any card to auto-fill the prompt, then hit Generate.
              </div>
            </div>

            <div className="hero-examples-grid">
              {heroExamples.map((ex) => (
                <button
                  key={ex.id}
                  className="card card-hover hero-example-card"
                  onClick={() => handleExampleClick(ex.prompt, ex.id)}
                >
                  <div className="hero-example-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.thumbnail}
                      alt={ex.title}
                      loading="lazy"
                      className={`crop-${ex.tag}`}
                    />
                  </div>

                  <div className="example-meta mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="example-title text-sm font-medium text-[var(--text)] truncate">
                        {ex.title}
                      </div>
                      <div className="example-sub text-xs text-[var(--muted)] mt-0.5">
                        {ex.tag}
                      </div>
                    </div>
                    <span className="badge badge-cta shrink-0 text-xs">
                      Use <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
