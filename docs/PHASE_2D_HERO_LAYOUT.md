（此文档由对话中 Phase 2D Hero 优化方案整理而成，用于指导后续实现与验收）

> 目标：一次性解决「横屏不美观 + 6 张尺寸不齐」，在不推翻现有体系的前提下，让首页 Hero 在 2026 年审美下变成 **System × Social × Visual Density** 的标准形态。

## 0. 状态与边界

- 当前状态：结构 OK、内容 OK，首屏已经进入「能跑 + 可信 + 像内容系统」阶段。
- 待解决问题：
  - 桌面横屏下，Hero 右侧 6 张 Examples 高矮不齐、视觉抢戏。
  - 右侧更像 Pinterest 瀑布流，而不是系统结果面板。
- 边界条件：
  - 不推翻 Hero 基本结构（左：System Panel，右：Results Wall）。
  - 不改变现有 Examples 类型配比和 SOP，只调整 **呈现方式**。

---

## 1. 设计目标（Phase 2D）

1. **横屏美观**：在 1440×900 / 1680×1050 / 1920×1080 下，Hero 右侧是整齐的 **2×2** 面板，而不是 6 张不齐图。
2. **结果为王**：首屏继续重点展示真实结果，但节奏从「图库」变成「系统面板」。
3. **社交感提升**：增加轻量的「recent activity」条，让用户感到这里有人在生成。

---

## 2. 验收标准

实现完成后，需要全部满足：

1. 桌面横屏首屏中，Hero 右侧仅展示 4 张卡片，等高等宽，排布为 **2×2**。
2. 其余 2 张 Examples（建议 Food + Real estate）出现在 Hero 下方的 SHOW 段（Popular scenarios），不再挤在首屏 Hero。
3. 任意 Example 换图后，不出现脸被裁掉、主体丢失或卡片尺寸不一致的问题（依靠统一容器比例 + tag-based crop）。
4. 不新增复杂依赖，`npm run build` 正常通过。

---

## 3. 数据层调整：Hero 专用 Slot

文件：`lib/examples.ts`

在 `HeroExample` 类型中新增 `heroSlot` 字段，标记每个 Example 在首页中的角色：

```ts
export type HeroExample = {
  id: string
  title: string
  tag: ExampleTag
  prompt: string
  ratio: ExampleRatio
  thumbnail: string

  // Phase 2D：Hero 右侧 or 下方 Show 段
  heroSlot?: 'hero' | 'show'
}
```

标记策略：

- `heroSlot: 'hero'`（4 张）：
  - `social_pov_meme_sign`（Social）
  - `ecom_skincare_hero_demo`（E-commerce）
  - `biz_friendly_explainer`（Business）
  - `creative_rainy_umbrella_scene`（Creative）
- `heroSlot: 'show'`（2 张）：
  - `food_ramen_steam`（Food）
  - `re_apartment_walkthrough`（Real estate）

数据层仍保留原有 `ratio` 和其他字段，**Phase 2D 不改 SOP，只改展示**。

---

## 4. Hero 右侧：从 6 张 → 4 张 2×2

文件：`app/HeroV2.tsx`

### 4.1 选出 Hero 用的 4 张卡

在组件内定义：

```ts
import type { HeroExample } from '@/lib/examples'

const heroExamples = HERO_EXAMPLES.filter((x) => x.heroSlot === 'hero').slice(0, 4)
```

后续右侧渲染都基于 `heroExamples`，不再直接用全量 `HERO_EXAMPLES`。

### 4.2 标准化卡片结构（2×2）

将右侧渲染区域调整为：

```tsx
<div className="hero-right">
  <div className="hero-examples-grid">
    {heroExamples.map((ex) => (
      <button
        key={ex.id}
        type="button"
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

        <div className="example-meta">
          <div>
            <div className="example-title">{ex.title}</div>
            <div className="example-sub">{ex.tag}</div>
          </div>
          <span className="badge badge-cta">Use →</span>
        </div>
      </button>
    ))}
  </div>
</div>
```

> 注意：`className="crop-${ex.tag}"` 为 Smart Crop 预留，用于后续 CSS 控制 `object-position`。

---

## 5. SHOW 段：承接 Food / Real estate

新增组件文件：`app/ShowStrip.tsx`

职责：在 Hero 之后展示 2 张更宽的场景卡片（例如 Food + Real estate），构成 SELL → SHOW 结构的第二段。

```tsx
'use client'

import Link from 'next/link'
import { HERO_EXAMPLES } from '@/lib/examples'

export default function ShowStrip() {
  const show = HERO_EXAMPLES.filter((x) => x.heroSlot === 'show').slice(0, 2)
  if (show.length === 0) return null

  return (
    <section className="showstrip">
      <div className="showstrip-head">
        <h2 className="showstrip-title">Popular scenarios</h2>
        <p className="showstrip-sub">Pick a proven style, then tweak the prompt.</p>
      </div>

      <div className="showstrip-grid">
        {show.map((ex) => (
          <Link
            key={ex.id}
            href={`/examples#${ex.id}`}
            className="card card-hover showstrip-card"
          >
            <div className="showstrip-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ex.thumbnail}
                alt={ex.title}
                loading="lazy"
                className={`crop-${ex.tag}`}
              />
            </div>
            <div className="showstrip-meta">
              <div>
                <div className="showstrip-name">{ex.title}</div>
                <div className="showstrip-tag">{ex.tag}</div>
              </div>
              <span className="badge badge-cta">See →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

然后在首页客户端入口（例如 `app/page.tsx` 或 `HomePageClient.tsx`）中：

```tsx
import ShowStrip from './ShowStrip'

// ...
<HeroV2 ... />
<ShowStrip />
```

---

## 6. Recent Activity：Hero 左侧轻量社交感

在 `HeroV2.tsx` 左侧（建议在证据条或 statusbar 下方）插入：

```tsx
<div className="recentline">
  <span className="recentpill">Live</span>
  <span className="recenttext">Someone just generated “Skincare demo ad”</span>
  <span className="recentmuted">· 2 min ago</span>
</div>
```

Phase 2D 中可先使用静态文案，后续再用 `event_logs` 或 generation 事件接真数据。

---

## 7. CSS：统一比例 + Smart Crop + SHOW 样式

文件：`app/globals.css`

### 7.1 Hero 右侧 2×2 和容器

```css
.hero-right {
  max-height: calc(100vh - 160px);
  overflow: hidden;
}

.hero-examples-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
}

.hero-example-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  text-align: left;
}

.hero-example-thumb {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

.hero-example-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  filter: saturate(0.98) contrast(0.98);
  transition: transform 200ms ease, filter 200ms ease;
}

.card-hover:hover .hero-example-thumb img {
  transform: scale(1.03);
  filter: saturate(1) contrast(1);
}

@media (max-width: 980px) {
  .hero-right {
    max-height: none;
    overflow: visible;
  }
  .hero-examples-grid {
    grid-template-columns: 1fr;
  }
  .hero-example-thumb {
    aspect-ratio: 16 / 9;
  }
}
```

### 7.2 SHOW 段样式

```css
.showstrip {
  margin-top: var(--sp-12);
  padding: 0 var(--sp-8);
}

.showstrip-head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-6);
}

.showstrip-title {
  font-size: 18px;
  font-weight: 750;
  color: var(--text);
}

.showstrip-sub {
  font-size: 13px;
  color: var(--muted);
  max-width: 70ch;
}

.showstrip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
}

.showstrip-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
}

.showstrip-thumb {
  aspect-ratio: 16 / 9;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

.showstrip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  transition: transform 200ms ease;
}

.card-hover:hover .showstrip-thumb img {
  transform: scale(1.03);
}

.showstrip-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.showstrip-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.showstrip-tag {
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .showstrip {
    padding: 0 var(--sp-4);
  }
  .showstrip-grid {
    grid-template-columns: 1fr;
  }
}
```

### 7.3 Smart Crop：按 tag 保护主体

```css
.hero-example-thumb img,
.showstrip-thumb img {
  object-fit: cover;
}

.crop-Social { object-position: 50% 22%; }
.crop-Business { object-position: 50% 20%; }
.crop-E-commerce { object-position: 50% 45%; }
.crop-Food { object-position: 50% 52%; }
.crop-Real\ estate { object-position: 50% 50%; }
.crop-Creative { object-position: 50% 42%; }
```

### 7.4 Recent Activity 样式

```css
.recentline {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
  color: var(--muted);
  font-size: 12px;
}

.recentpill {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  font-weight: 650;
}

.recenttext { color: var(--text); }
.recentmuted { color: var(--muted); }
```

---

## 8. 总结

Phase 2D 的目标不是再做一次大改，而是：

- **在你已经“能跑 + 能信任”的基础上，修正横屏观感和视觉秩序**；
- **让 Hero 更像「系统首屏控制台」，而不是「素材瀑布流」**；
- **通过 Smart Crop 和 Slot 化，让未来任何换图都不再反复调布局**。

后续 Phase 2E / 2F，可以在这套结构上继续叠加：  
比如真实 `recent activity` 数据、更多 SHOW 场景、或 AB 测系统 vs. 内容权重，但这一版应视为 **V2.5 的布局基线**。

