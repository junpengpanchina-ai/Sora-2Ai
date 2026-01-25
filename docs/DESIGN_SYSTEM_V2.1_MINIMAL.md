# Sora2Ai 设计系统 V2.1 - 克制版

> 80% 黑白灰，20% 蓝紫渐变。越少，越高级。

## 核心原则

```
1. 克制 - 动画只服务于状态切换和入场
2. 层级 - 用 surface 层级区分，不用炫技效果
3. 聚焦 - 首屏只做一件事：让用户立刻开始生成
4. 统一 - 每类组件最多 3 个变体
```

---

## 信息架构（首页三段式）

```
┌─────────────────────────────────────────────────────────┐
│  SELL (首屏)                                            │
│  ├─ 一句话价值                                          │
│  ├─ 证据条 (3 个点)                                     │
│  ├─ 输入框 + 主 CTA                                     │
│  └─ Examples 卡片 (6 个)                                │
├─────────────────────────────────────────────────────────┤
│  SHOW (展示)                                            │
│  ├─ 视频样例 / 模板                                     │
│  └─ Use Cases 简化版                                    │
├─────────────────────────────────────────────────────────┤
│  EXPLAIN (解释)                                         │
│  ├─ Pricing                                             │
│  ├─ FAQ                                                 │
│  ├─ 合规 / 隐私                                         │
│  └─ SEO 长文 (折叠或最底部)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 语义化 Tokens

```css
:root {
  /* === Brand === */
  --primary: #2080ff;
  --secondary: #8b5cf6;
  --accent: #10b981;

  /* === Text === */
  --text: rgba(241, 245, 249, 0.92);
  --muted: rgba(241, 245, 249, 0.66);

  /* === Surfaces === */
  --bg: #0a0f1a;
  --surface: rgba(255, 255, 255, 0.04);
  --surface-2: rgba(255, 255, 255, 0.06);

  /* === Borders === */
  --border: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);

  /* === Shadows (克制) === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.35);

  /* === Focus ring === */
  --ring: rgba(32, 128, 255, 0.45);
  --ring-soft: rgba(32, 128, 255, 0.20);

  /* === Radius === */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;

  /* === Spacing (只用这 7 个) === */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-12: 48px;

  /* === Gradients (只留一个主渐变) === */
  --grad-primary: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
}
```

---

## 组件规范

### Button（3 变体 + 2 尺寸）

| 变体 | 用途 | 背景 | 边框 |
|------|------|------|------|
| `btn-primary` | 主 CTA | 渐变 | 无 |
| `btn-secondary` | 次要操作 | surface | border |
| `btn-ghost` | 文字按钮 | 透明 | 无 |

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: transform 120ms ease, 
              background-color 120ms ease, 
              border-color 120ms ease, 
              box-shadow 120ms ease;
}

.btn-sm { 
  height: 36px; 
  padding: 0 12px; 
  font-size: 12px; 
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring-soft), 0 0 0 1px var(--ring);
}

/* Primary */
.btn-primary {
  background: var(--grad-primary);
  color: white;
  box-shadow: 0 8px 24px rgba(32, 128, 255, 0.25);
}
.btn-primary:hover { 
  transform: translateY(-1px); 
  box-shadow: 0 12px 34px rgba(32, 128, 255, 0.32); 
}
.btn-primary:active { 
  transform: translateY(0); 
}

/* Secondary */
.btn-secondary {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}
.btn-secondary:hover { 
  background: var(--surface-2); 
  border-color: var(--border-strong); 
}

/* Ghost */
.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--muted);
}
.btn-ghost:hover { 
  background: var(--surface); 
  color: var(--text); 
}

/* Disabled */
.btn:disabled { 
  opacity: 0.55; 
  cursor: not-allowed; 
  transform: none; 
  box-shadow: none; 
}
```

### Card（统一风格，靠层级取胜）

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-sm);
}

.card-hover {
  transition: transform 160ms ease, 
              background-color 160ms ease, 
              border-color 160ms ease, 
              box-shadow 160ms ease;
}

.card-hover:hover {
  background: var(--surface-2);
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Input

```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 14px;
  color: var(--text);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color 120ms ease, 
              box-shadow 120ms ease, 
              background-color 120ms ease;
}

.input::placeholder { 
  color: rgba(241, 245, 249, 0.45); 
}

.input:hover {
  background: rgba(255, 255, 255, 0.045);
  border-color: var(--border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--ring-soft);
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--muted);
}
```

---

## 动效规范（只保留 6 个）

```css
/* 1. 渐入 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 2. 向上渐入 */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 3. 缩放渐入 */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* 4. 骨架屏 */
@keyframes skeleton {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 5. 加载旋转 */
@keyframes spinner {
  to { transform: rotate(360deg); }
}

/* 6. 手风琴展开 */
@keyframes accordion {
  from { height: 0; opacity: 0; }
  to { height: var(--accordion-height); opacity: 1; }
}

/* 工具类 */
.animate-fade-in { animation: fade-in 200ms ease-out; }
.animate-fade-up { animation: fade-up 300ms ease-out; }
.animate-scale-in { animation: scale-in 200ms ease-out; }
```

---

## 删除清单（V2 → V2.1）

| 删除项 | 原因 |
|--------|------|
| `text-shine` 无限动画 | 廉价感 |
| `glow-pulse` | 干扰视觉 |
| `card-tilt` | 过度炫技 |
| `card-spotlight` | 过度炫技 |
| `border-rotate` | 过度炫技 |
| `aurora` 渐变 | 密度过高 |
| `heartbeat` / `wiggle` / `bounce` | 产品型网站不需要 |
| 多层渐变背景 | 改用纯深色 |
| 组件 4+ 变体 | 统一到 2-3 个 |

---

## 首屏文案

```
Badge:      NEW • Sora-2 + Veo Fast/Pro
H1:         Create cinematic videos from a single prompt.
Subtitle:   Turn text or images into high-quality clips in minutes. 
            Pay with prepaid credits — no subscriptions.

证据条:
- No watermark (Sora-2)
- Fast queue + reliable retries  
- Prepaid credits only

Placeholder: e.g., "A neon-lit cyberpunk street in the rain, cinematic, slow dolly, 4K"

主按钮:     Generate video
次按钮:     See pricing

小字:       By generating, you agree to the Terms. 
            We don't promise rankings — we ship reliable infrastructure.
```

---

## Examples 卡片（6 个）

| 标题 | 标签 | Prompt |
|------|------|--------|
| Cyberpunk rain street | Text → Video | A neon-lit cyberpunk street in the rain, cinematic, slow dolly, 4K |
| Product hero shot | Text → Video | A premium smartwatch on black marble, studio lighting, shallow depth of field, macro cinematic |
| Anime character close-up | Text → Video | Anime close-up portrait, soft rim light, subtle breathing motion, film grain |
| Real estate walkthrough | Text → Video | Modern apartment walkthrough, wide angle, smooth gimbal, warm afternoon light |
| Food macro cinematic | Text → Video | Macro shot of ramen steam swirling, cinematic, 60fps slow motion, bokeh highlights |
| Talking avatar demo | Image → Video | Use the uploaded portrait. Natural talking head, subtle head movement, realistic lighting |

---

## 落地优先级

### Day 1-2：结构改动
- [ ] 首页拆三段：Sell / Show / Explain
- [ ] SEO 文本移到最底部
- [ ] 空指标卡隐藏
- [ ] 导航简化：Prompts / Generate / Pricing / Examples / Sign in

### Day 3-5：视觉规则
- [ ] 统一 radius / shadow / border
- [ ] Button & Card 只保留 2-3 变体
- [ ] 删除无限循环动画
- [ ] 增加 Examples 真实缩略图

### Week 2：组件库化
- [ ] 抽取 Button/Card/Input/Badge 组件
- [ ] 统一 Token 使用
- [ ] 清理冗余样式

---

**文档版本**: v2.1.0  
**最后更新**: 2026-01-25  
**设计理念**: 克制即高级
