'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics/events'

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

const EXAMPLES = [
  { 
    title: "Cyberpunk rain street", 
    tag: "Text → Video", 
    prompt: "A neon-lit cyberpunk street in the rain, cinematic, slow dolly, 4K",
    // 占位色：蓝紫赛博朋克风
    gradient: "linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)",
    icon: "🌃"
  },
  { 
    title: "Product hero shot", 
    tag: "Text → Video", 
    prompt: "A premium smartwatch on black marble, studio lighting, shallow depth of field, macro cinematic",
    // 占位色：金属质感
    gradient: "linear-gradient(135deg, rgba(100, 116, 139, 0.3) 0%, rgba(82, 82, 91, 0.3) 100%)",
    icon: "⌚"
  },
  { 
    title: "Anime character close-up", 
    tag: "Text → Video", 
    prompt: "Anime close-up portrait, soft rim light, subtle breathing motion, film grain",
    // 占位色：动漫柔和
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(244, 63, 94, 0.3) 100%)",
    icon: "🎭"
  },
  { 
    title: "Real estate walkthrough", 
    tag: "Text → Video", 
    prompt: "Modern apartment walkthrough, wide angle, smooth gimbal, warm afternoon light",
    // 占位色：暖色室内
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)",
    icon: "🏠"
  },
  { 
    title: "Food macro cinematic", 
    tag: "Text → Video", 
    prompt: "Macro shot of ramen steam swirling, cinematic, 60fps slow motion, bokeh highlights",
    // 占位色：暖色食物
    gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)",
    icon: "🍜"
  },
  { 
    title: "Talking avatar demo", 
    tag: "Image → Video", 
    prompt: "Use the uploaded portrait. Natural talking head, subtle head movement, realistic lighting",
    // 占位色：人像柔和
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.3) 100%)",
    icon: "👤"
  },
]

interface HeroV2Props {
  isLoggedIn?: boolean
  onGenerate?: (prompt: string) => void
}

export default function HeroV2({ isLoggedIn = false, onGenerate }: HeroV2Props) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleExampleClick = (examplePrompt: string, exampleTitle: string) => {
    setPrompt(examplePrompt)
    inputRef.current?.focus()
    // Phase 2 埋点
    Events.exampleClick(undefined, exampleTitle)
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

            {/* 输入区域 */}
            <div className="mt-8">
              <div className="card p-4">
                <label className="block text-xs mb-2 text-[var(--muted)] font-medium">
                  Your prompt
                </label>
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
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                className="card card-hover text-left p-3 group"
                onClick={() => handleExampleClick(ex.prompt, ex.title)}
              >
                {/* 缩略图：16:9 比例，渐变占位 */}
                <div 
                  className="aspect-video w-full rounded-lg overflow-hidden border border-[var(--border)] flex items-center justify-center"
                  style={{ background: ex.gradient }}
                >
                  <span className="text-3xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-200" suppressHydrationWarning>
                    {ex.icon}
                  </span>
                </div>
                
                {/* 标题和标签 */}
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text)] truncate">
                      {ex.title}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {ex.tag}
                    </div>
                  </div>
                  <span className="badge shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    Use
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
