const primaryColors = [
  {
    name: '极致纯白',
    hex: '#FFFFFF',
    energy: '纯金',
    usage: '背景、大面积主色，聚焦内容与信息层次',
  },
  {
    name: '深空黑',
    hex: '#0A0A0A',
    energy: '玄水',
    usage: '导航、头部或重点背景，传达权威与深度',
  },
]

const accentColors = [
  {
    name: '科技蓝',
    hex: '#0066CC',
    energy: '活力之水',
    usage: '主按钮、主要链接、互动高亮',
  },
  {
    name: '深海蓝',
    hex: '#003366',
    energy: '深邃之水',
    usage: '次级按钮、悬浮态、次层强调',
  },
]

export default function StylePreviewPage() {
  return (
    <main className="min-h-screen bg-[var(--energy-base-soft)] text-[var(--energy-deep-black)] py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <header className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--energy-gold-mid)] bg-white/80 px-4 py-1 text-sm font-medium text-[var(--energy-gold-mid)] shadow-sm">
            金白为骨 · 水蓝为脉
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">金生水能量配色测试页</h1>
          <p className="max-w-3xl text-lg text-[rgba(10,10,10,0.75)]">
            该页面用于快速验证“金生水”主题在实际界面中的视觉效果，通过主色、辅色与点缀色的组合，观察层次、对比与氛围是否符合预期。
          </p>
        </header>

        <section className="rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg">
          <h2 className="text-2xl font-semibold">色彩配比</h2>
          <p className="mt-2 text-sm text-[rgba(10,10,10,0.65)]">70% 主色 · 25% 辅助色 · 5% 点缀色</p>
          <div className="mt-6 overflow-hidden rounded-full border border-[rgba(10,10,10,0.1)]">
            <div className="flex h-6">
              <div className="h-full w-[70%]" style={{ backgroundColor: 'var(--energy-base-white)' }} />
              <div className="h-full w-[25%]" style={{ backgroundColor: 'var(--energy-water-blue)' }} />
              <div className="h-full w-[5%]" style={{ backgroundImage: 'var(--energy-gold-gradient)' }} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 text-sm text-[rgba(10,10,10,0.65)] sm:grid-cols-3">
            <div className="rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3">
              <div className="font-semibold text-[var(--energy-deep-black)]">主色</div>
              <div>纯白/银白 · 70%</div>
            </div>
            <div className="rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3">
              <div className="font-semibold text-[var(--energy-deep-black)]">辅助色</div>
              <div>科技蓝/深海蓝 · 25%</div>
            </div>
            <div className="rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3">
              <div className="font-semibold text-[var(--energy-deep-black)]">点缀色</div>
              <div>浅金/金属渐变 · 5%</div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg">
            <h2 className="text-2xl font-semibold">主色调 · 金为骨架</h2>
            <p className="mt-2 text-sm text-[rgba(10,10,10,0.65)]">奠定界面基调，构建纯净且有深度的空间。</p>
            <div className="mt-6 space-y-4">
              {primaryColors.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-xl border border-white/40 shadow-inner"
                      style={{
                        backgroundColor: color.hex,
                        backgroundImage: color.hex === '#0A0A0A' ? 'linear-gradient(145deg, #050505, #111111)' : undefined,
                        boxShadow: color.hex === '#FFFFFF' ? 'inset 0 0 8px rgba(10,10,10,0.04)' : undefined,
                      }}
                    />
                    <div>
                      <div className="text-lg font-semibold text-[var(--energy-deep-black)]">{color.name}</div>
                      <div className="text-sm text-[rgba(10,10,10,0.65)]">{color.usage}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-[rgba(10,10,10,0.55)]">
                    <div>{color.hex}</div>
                    <div>{color.energy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg">
            <h2 className="text-2xl font-semibold">辅助色 · 水为流动</h2>
            <p className="mt-2 text-sm text-[rgba(10,10,10,0.65)]">驱动互动行为，激活“妻财星”流动。</p>
            <div className="mt-6 space-y-4">
              {accentColors.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-xl border border-black/20 shadow-inner"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />
                    <div>
                      <div className="text-lg font-semibold text-[var(--energy-deep-black)]">{color.name}</div>
                      <div className="text-sm text-[rgba(10,10,10,0.65)]">{color.usage}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-[rgba(10,10,10,0.55)]">
                    <div>{color.hex}</div>
                    <div>{color.energy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg">
          <h2 className="text-2xl font-semibold">点缀色 · 金属之光</h2>
          <p className="mt-2 text-sm text-[rgba(10,10,10,0.65)]">用于边框、分割线、微交互，让价值感溢出而不过度。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-6 shadow-sm">
              <div
                className="h-20 w-full rounded-xl border border-white/20 shadow-inner"
                style={{ backgroundImage: 'var(--energy-gold-gradient)' }}
              />
              <div className="mt-4 text-sm text-[rgba(10,10,10,0.65)]">
                <div className="font-medium text-[var(--energy-deep-black)]">金属渐变</div>
                <div>linear-gradient(135deg, #F5D97D → #D7B14C → #F5E5B5)</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-6 shadow-sm">
              <div className="text-sm text-[rgba(10,10,10,0.65)]">
                <div className="font-medium text-[var(--energy-deep-black)]">细节用法示例</div>
                <ul className="mt-3 space-y-2">
                  <li>· LOGO 线条或首字母强调</li>
                  <li>· 卡片描边与分隔线（1px-2px）</li>
                  <li>· 数据亮点或顶部指示条</li>
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['#F5D97D', '#D7B14C', '#F5E5B5'].map((hex) => (
                  <div key={hex} className="rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/60 p-3 text-center text-sm text-[rgba(10,10,10,0.6)]">
                    <div className="h-12 w-full rounded-lg shadow-inner" style={{ backgroundColor: hex }} />
                    <div className="mt-2 font-medium text-[var(--energy-deep-black)]">{hex}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-black p-8 text-white shadow-custom-xl">
            <div className="text-sm uppercase tracking-[0.3em] text-[rgba(255,255,255,0.65)]">Hero 示例</div>
            <h3 className="mt-4 text-3xl font-semibold text-white">金生水 — 聚势引流</h3>
            <p className="mt-3 text-sm text-[rgba(255,255,255,0.75)]">
              深空黑作背景，金属线条与蓝色按钮作为焦点，营造科技感与高端气质。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--energy-water-blue)' }}
              >
                立即体验
              </button>
              <button
                className="rounded-full border px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.85)] hover:text-white"
                style={{
                  borderColor: '#F5D97D',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              >
                了解方案
              </button>
            </div>
            <div className="mt-8 h-px w-full" style={{ backgroundImage: 'var(--energy-gold-gradient)' }} />
            <div className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-white/30" style={{ backgroundImage: 'var(--energy-gold-gradient)' }} />
              <div className="text-sm text-[rgba(255,255,255,0.75)]">
                <div className="font-semibold text-white">金水同源</div>
                <div>四两拨千斤的能量引导叙事</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg">
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-semibold text-[rgba(10,10,10,0.6)]">卡片示例</div>
                <div className="mt-3 rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/70 p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,10,10,0.45)]">Insight</div>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--energy-deep-black)]">能量路径最短</h3>
                  <p className="mt-2 text-sm text-[rgba(10,10,10,0.65)]">
                    纯白承载信息，深空黑构建对比，蓝色引导操作，金色点睛强调价值。
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="flex items-center gap-2 rounded-full bg-[var(--energy-water-blue)] px-4 py-2 text-xs font-semibold text-white">
                      行动 CTA
                    </span>
                    <span className="text-xs text-[rgba(10,10,10,0.55)]">Hover 提亮 8% 即可完成状态反馈</span>
                  </div>
                  <div className="mt-6 h-px w-full" style={{ backgroundImage: 'var(--energy-gold-gradient)' }} />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[rgba(10,10,10,0.6)]">按钮状态</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <button
                    className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md"
                    style={{ backgroundColor: 'var(--energy-water-blue)' }}
                  >
                    默认
                  </button>
                  <button
                    className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md"
                    style={{ backgroundColor: '#1c7fe6' }}
                  >
                    悬浮态
                  </button>
                  <button
                    className="rounded-full px-5 py-2 text-sm font-semibold text-[rgba(10,10,10,0.45)]"
                    style={{ backgroundColor: 'rgba(0,102,204,0.2)' }}
                    disabled
                  >
                    禁用态
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="rounded-2xl border border-white/60 bg-white p-8 text-sm text-[rgba(10,10,10,0.6)] shadow-custom-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[var(--energy-deep-black)]">落地建议</div>
              <p>在实际开发中可将上述变量写入主题 token，通过 Tailwind 的 `bg-[color]` 与 CSS 自定义属性结合，实现灵活调度。</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-24 rounded-full border border-[rgba(10,10,10,0.08)]" style={{ backgroundImage: 'var(--energy-gold-gradient)' }} />
              <div className="text-xs text-[rgba(10,10,10,0.55)]">金生水 · 能量循环演示</div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

