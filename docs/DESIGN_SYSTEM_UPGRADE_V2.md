# Sora2Ai 设计系统升级方案 V2.0

> 全面现代化全局样式，提升用户体验感

## 目录

1. [问题诊断](#问题诊断)
2. [设计原则](#设计原则)
3. [色彩系统升级](#色彩系统升级)
4. [字体排版升级](#字体排版升级)
5. [组件系统升级](#组件系统升级)
6. [动效系统](#动效系统)
7. [微交互设计](#微交互设计)
8. [响应式优化](#响应式优化)
9. [深色模式优化](#深色模式优化)
10. [可访问性增强](#可访问性增强)
11. [实施计划](#实施计划)

---

## 问题诊断

### 当前样式问题

| 问题类型 | 具体表现 | 影响 |
|---------|---------|------|
| 视觉层次不清 | 标题、正文、辅助文字对比度不够 | 阅读体验差 |
| 交互反馈弱 | 按钮、链接缺少悬停/点击反馈 | 操作感不强 |
| 组件风格不统一 | Card、Button 等风格混杂 | 品牌感弱 |
| 动效缺失 | 页面切换、组件状态变化无动画 | 体验生硬 |
| 色彩单调 | 主色调使用单一，缺少渐变和层次 | 视觉疲劳 |
| 间距不规范 | 元素间距不统一 | 排版混乱 |
| 移动端适配差 | 部分组件在小屏幕上显示异常 | 移动用户流失 |

---

## 设计原则

### 2.1 核心原则

```
1. 一致性 (Consistency)     - 统一的视觉语言和交互模式
2. 可感知性 (Perceptibility) - 清晰的视觉层次和状态反馈
3. 现代感 (Modernity)       - 跟随设计趋势，保持新鲜感
4. 情感化 (Emotional)       - 通过细节创造愉悦体验
5. 高效性 (Efficiency)      - 减少认知负担，提升操作效率
```

### 2.2 设计关键词

- **Glassmorphism** - 玻璃拟态效果
- **Neumorphism Light** - 轻量新拟态
- **Gradient Mesh** - 网格渐变
- **Micro-interactions** - 微交互
- **Smooth Transitions** - 平滑过渡

---

## 色彩系统升级

### 3.1 主色调优化

```css
:root {
  /* === 主品牌色 - 宇宙蓝 === */
  --primary-50: #e8f4ff;
  --primary-100: #d4ebff;
  --primary-200: #b0d9ff;
  --primary-300: #7bc2ff;
  --primary-400: #4aa3ff;
  --primary-500: #2080ff;  /* 主色 */
  --primary-600: #0066e6;
  --primary-700: #0052bd;
  --primary-800: #00429a;
  --primary-900: #003577;
  --primary-950: #001f4d;
  
  /* === 次要色 - 星云紫 === */
  --secondary-50: #f5f3ff;
  --secondary-100: #ede9fe;
  --secondary-200: #ddd6fe;
  --secondary-300: #c4b5fd;
  --secondary-400: #a78bfa;
  --secondary-500: #8b5cf6;  /* 主色 */
  --secondary-600: #7c3aed;
  --secondary-700: #6d28d9;
  --secondary-800: #5b21b6;
  --secondary-900: #4c1d95;
  --secondary-950: #2e1065;
  
  /* === 强调色 - 极光绿 === */
  --accent-50: #ecfdf5;
  --accent-100: #d1fae5;
  --accent-200: #a7f3d0;
  --accent-300: #6ee7b7;
  --accent-400: #34d399;
  --accent-500: #10b981;  /* 主色 */
  --accent-600: #059669;
  --accent-700: #047857;
  --accent-800: #065f46;
  --accent-900: #064e3b;
  --accent-950: #022c22;
  
  /* === 高亮色 - 日落橙 === */
  --highlight-50: #fff7ed;
  --highlight-100: #ffedd5;
  --highlight-200: #fed7aa;
  --highlight-300: #fdba74;
  --highlight-400: #fb923c;
  --highlight-500: #f97316;  /* 主色 */
  --highlight-600: #ea580c;
  --highlight-700: #c2410c;
  --highlight-800: #9a3412;
  --highlight-900: #7c2d12;
  --highlight-950: #431407;
  
  /* === 中性色 - 精细调整 === */
  --gray-25: #fcfcfd;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --gray-950: #030712;
}
```

### 3.2 渐变系统

```css
:root {
  /* === 主品牌渐变 === */
  --gradient-primary: linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%);
  --gradient-primary-soft: linear-gradient(135deg, var(--primary-100) 0%, var(--secondary-100) 100%);
  
  /* === 宇宙背景渐变 === */
  --gradient-cosmic: linear-gradient(
    145deg,
    #0a0f1a 0%,
    #0d1526 25%,
    #101d35 50%,
    #0d1f3c 75%,
    #081428 100%
  );
  
  /* === 玻璃渐变 === */
  --gradient-glass: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  
  /* === 卡片悬浮渐变 === */
  --gradient-card-hover: linear-gradient(
    145deg,
    rgba(32, 128, 255, 0.08) 0%,
    rgba(139, 92, 246, 0.08) 100%
  );
  
  /* === 按钮发光渐变 === */
  --gradient-button-glow: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  
  /* === 文字渐变 === */
  --gradient-text-shine: linear-gradient(
    90deg,
    var(--primary-400) 0%,
    var(--secondary-400) 50%,
    var(--accent-400) 100%
  );
  
  /* === Aurora 极光渐变 === */
  --gradient-aurora: linear-gradient(
    45deg,
    var(--primary-500) 0%,
    var(--secondary-500) 25%,
    var(--accent-500) 50%,
    var(--secondary-500) 75%,
    var(--primary-500) 100%
  );
}
```

### 3.3 语义化颜色

```css
:root {
  /* === 功能色 === */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.1);
  --success-border: rgba(16, 185, 129, 0.3);
  
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.1);
  --warning-border: rgba(245, 158, 11, 0.3);
  
  --error: #ef4444;
  --error-bg: rgba(239, 68, 68, 0.1);
  --error-border: rgba(239, 68, 68, 0.3);
  
  --info: #3b82f6;
  --info-bg: rgba(59, 130, 246, 0.1);
  --info-border: rgba(59, 130, 246, 0.3);
}
```

---

## 字体排版升级

### 4.1 字体栈优化

```css
:root {
  /* === 主字体 - 优先使用系统字体 === */
  --font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC', 
               'Microsoft YaHei', sans-serif;
  
  /* === 显示字体 - 用于大标题 === */
  --font-display: 'Cal Sans', 'SF Pro Display', var(--font-sans);
  
  /* === 等宽字体 - 代码展示 === */
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 
               Menlo, Monaco, Consolas, monospace;
}
```

### 4.2 字体大小系统

```css
:root {
  /* === 基础字号（使用 clamp 实现流式缩放）=== */
  --text-xs: clamp(0.65rem, 0.6rem + 0.25vw, 0.75rem);      /* 10-12px */
  --text-sm: clamp(0.75rem, 0.7rem + 0.3vw, 0.875rem);      /* 12-14px */
  --text-base: clamp(0.875rem, 0.8rem + 0.4vw, 1rem);       /* 14-16px */
  --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);         /* 16-18px */
  --text-xl: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);        /* 18-20px */
  --text-2xl: clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem);       /* 20-24px */
  --text-3xl: clamp(1.5rem, 1.2rem + 1.5vw, 1.875rem);      /* 24-30px */
  --text-4xl: clamp(1.875rem, 1.4rem + 2.5vw, 2.25rem);     /* 30-36px */
  --text-5xl: clamp(2.25rem, 1.6rem + 3.5vw, 3rem);         /* 36-48px */
  --text-6xl: clamp(3rem, 2rem + 5vw, 3.75rem);             /* 48-60px */
  --text-7xl: clamp(3.75rem, 2.5rem + 6vw, 4.5rem);         /* 60-72px */
  
  /* === 行高 === */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* === 字重 === */
  --font-thin: 100;
  --font-extralight: 200;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
  
  /* === 字间距 === */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
}
```

### 4.3 标题样式类

```css
/* === 显示标题 - 用于 Hero 区域 === */
.display-1 {
  font-family: var(--font-display);
  font-size: var(--text-7xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  background: var(--gradient-text-shine);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: text-shine 3s linear infinite;
}

.display-2 {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

/* === 文章标题 === */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.heading-4 {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

/* === 正文样式 === */
.body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.body-small {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* === 辅助文字 === */
.caption {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--gray-500);
}

.overline {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--gray-500);
}
```

---

## 组件系统升级

### 5.1 按钮系统

```css
/* === 按钮基础样式 === */
.btn {
  --btn-height: 2.5rem;
  --btn-px: 1rem;
  --btn-radius: 0.625rem;
  --btn-font-size: var(--text-sm);
  --btn-font-weight: var(--font-semibold);
  
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: var(--btn-height);
  padding: 0 var(--btn-px);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  border-radius: var(--btn-radius);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* === 按钮尺寸变体 === */
.btn-xs {
  --btn-height: 1.75rem;
  --btn-px: 0.625rem;
  --btn-font-size: var(--text-xs);
}

.btn-sm {
  --btn-height: 2rem;
  --btn-px: 0.75rem;
  --btn-font-size: var(--text-xs);
}

.btn-lg {
  --btn-height: 3rem;
  --btn-px: 1.5rem;
  --btn-font-size: var(--text-base);
}

.btn-xl {
  --btn-height: 3.5rem;
  --btn-px: 2rem;
  --btn-font-size: var(--text-lg);
}

/* === Primary 按钮 === */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(32, 128, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 8px 20px rgba(32, 128, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(32, 128, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* === Secondary 按钮 === */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* === Ghost 按钮 === */
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: none;
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

/* === Outline 按钮 === */
.btn-outline {
  background: transparent;
  color: var(--primary-500);
  border: 1px solid var(--primary-500);
}

.btn-outline:hover {
  background: var(--primary-50);
}

/* === Danger 按钮 === */
.btn-danger {
  background: var(--error);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-danger:hover {
  background: #dc2626;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
}

/* === 按钮加载状态 === */
.btn-loading {
  pointer-events: none;
  opacity: 0.7;
}

.btn-loading::after {
  content: '';
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* === 按钮禁用状态 === */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
```

### 5.2 卡片系统

```css
/* === 卡片基础样式 === */
.card {
  --card-radius: 1rem;
  --card-padding: 1.5rem;
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.08);
  
  position: relative;
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === 卡片悬浮效果 === */
.card-hover:hover {
  --card-bg: rgba(255, 255, 255, 0.06);
  --card-border: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
  box-shadow: 
    0 20px 40px -20px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* === 卡片发光边框 === */
.card-glow {
  position: relative;
}

.card-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: var(--gradient-primary);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.card-glow:hover::before {
  opacity: 1;
}

/* === 玻璃态卡片 === */
.card-glass {
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-border: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* === 内容卡片（浅色背景用）=== */
.card-elevated {
  --card-bg: white;
  --card-border: var(--gray-200);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 30px -5px rgba(0, 0, 0, 0.08);
}

.card-elevated:hover {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 20px 40px -5px rgba(0, 0, 0, 0.15);
}

/* === 交互式卡片 === */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-2px) scale(1.01);
}

.card-interactive:active {
  transform: translateY(0) scale(0.99);
}

/* === 卡片尺寸 === */
.card-sm {
  --card-padding: 1rem;
  --card-radius: 0.75rem;
}

.card-lg {
  --card-padding: 2rem;
  --card-radius: 1.25rem;
}
```

### 5.3 输入框系统

```css
/* === 输入框基础样式 === */
.input {
  --input-height: 2.75rem;
  --input-px: 1rem;
  --input-radius: 0.625rem;
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: rgba(255, 255, 255, 0.12);
  --input-focus-ring: var(--primary-500);
  
  width: 100%;
  height: var(--input-height);
  padding: 0 var(--input-px);
  font-size: var(--text-sm);
  color: inherit;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--input-radius);
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.input::placeholder {
  color: var(--gray-400);
}

.input:hover {
  --input-border: rgba(255, 255, 255, 0.2);
}

.input:focus {
  outline: none;
  --input-border: var(--input-focus-ring);
  box-shadow: 
    0 0 0 3px rgba(32, 128, 255, 0.15),
    0 0 20px rgba(32, 128, 255, 0.1);
}

/* === 输入框变体 === */
.input-filled {
  --input-bg: var(--gray-100);
  --input-border: transparent;
  backdrop-filter: none;
}

.input-filled:hover {
  --input-bg: var(--gray-200);
}

.input-filled:focus {
  --input-bg: white;
  --input-border: var(--input-focus-ring);
}

/* === 输入框状态 === */
.input-error {
  --input-border: var(--error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.input-success {
  --input-border: var(--success);
}

/* === 输入框尺寸 === */
.input-sm {
  --input-height: 2.25rem;
  --input-px: 0.75rem;
  font-size: var(--text-xs);
}

.input-lg {
  --input-height: 3.25rem;
  --input-px: 1.25rem;
  font-size: var(--text-base);
}

/* === 带图标输入框 === */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group .input {
  padding-left: 2.75rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--gray-400);
  pointer-events: none;
}

/* === 文本域 === */
.textarea {
  min-height: 6rem;
  padding: 0.75rem var(--input-px);
  resize: vertical;
}
```

### 5.4 徽章系统

```css
/* === 徽章基础样式 === */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: 9999px;
  white-space: nowrap;
}

/* === 徽章变体 === */
.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.badge-secondary {
  background: var(--secondary-100);
  color: var(--secondary-700);
}

.badge-success {
  background: var(--success-bg);
  color: #059669;
}

.badge-warning {
  background: var(--warning-bg);
  color: #d97706;
}

.badge-error {
  background: var(--error-bg);
  color: #dc2626;
}

.badge-info {
  background: var(--info-bg);
  color: #2563eb;
}

/* === 深色模式徽章 === */
.badge-dark {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* === 发光徽章 === */
.badge-glow {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(32, 128, 255, 0.3);
}

/* === 带图标徽章 === */
.badge-dot::before {
  content: '';
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
}

/* === 徽章尺寸 === */
.badge-sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
}

.badge-lg {
  padding: 0.375rem 0.875rem;
  font-size: var(--text-sm);
}
```

### 5.5 提示框系统

```css
/* === 提示框基础样式 === */
.alert {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: var(--text-sm);
}

.alert-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: var(--font-semibold);
  margin-bottom: 0.25rem;
}

.alert-description {
  opacity: 0.9;
}

/* === 提示框变体 === */
.alert-info {
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  color: var(--info);
}

.alert-success {
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success);
}

.alert-warning {
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  color: var(--warning);
}

.alert-error {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error);
}

/* === 深色模式提示框 === */
.dark .alert-info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

/* ... 其他深色模式变体 ... */
```

---

## 动效系统

### 6.1 基础过渡

```css
:root {
  /* === 缓动函数 === */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
  
  /* === 持续时间 === */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --duration-slowest: 700ms;
}

/* === 预设过渡类 === */
.transition-all {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.transition-colors {
  transition: color, background-color, border-color, fill, stroke 
              var(--duration-fast) var(--ease-smooth);
}

.transition-opacity {
  transition: opacity var(--duration-normal) var(--ease-smooth);
}

.transition-transform {
  transition: transform var(--duration-normal) var(--ease-smooth);
}

.transition-shadow {
  transition: box-shadow var(--duration-normal) var(--ease-smooth);
}
```

### 6.2 关键帧动画

```css
/* === 渐入动画 === */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* === 缩放动画 === */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scale-up {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* === 旋转动画 === */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* === 脉冲动画 === */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

/* === 弹跳动画 === */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* === 摇晃动画 === */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

/* === 文字闪烁效果 === */
@keyframes text-shine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* === 光晕效果 === */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(32, 128, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(32, 128, 255, 0.6);
  }
}

/* === 渐变流动 === */
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* === 浮动效果 === */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* === 骨架屏动画 === */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* === 动画工具类 === */
.animate-fade-in { animation: fade-in var(--duration-normal) var(--ease-out); }
.animate-fade-in-up { animation: fade-in-up var(--duration-slow) var(--ease-out); }
.animate-fade-in-down { animation: fade-in-down var(--duration-slow) var(--ease-out); }
.animate-scale-in { animation: scale-in var(--duration-normal) var(--ease-bounce); }
.animate-bounce-in { animation: bounce-in var(--duration-slower) var(--ease-out); }
.animate-spin { animation: spin 1s linear infinite; }
.animate-spin-slow { animation: spin-slow 3s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }
.animate-shake { animation: shake 0.5s ease-in-out; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-glow { animation: glow-pulse 2s ease-in-out infinite; }
```

### 6.3 页面过渡

```css
/* === 页面进入动画 === */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s var(--ease-out);
}

/* === 页面退出动画 === */
.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 0.2s var(--ease-in);
}

/* === 交错动画 === */
.stagger-children > * {
  opacity: 0;
  animation: fade-in-up 0.5s var(--ease-out) forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.4s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.5s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.6s; }
.stagger-children > *:nth-child(7) { animation-delay: 0.7s; }
.stagger-children > *:nth-child(8) { animation-delay: 0.8s; }
```

---

## 微交互设计

### 7.1 按钮微交互

```css
/* === 按钮涟漪效果 === */
.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}

.btn-ripple:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

/* === 按钮边框动画 === */
.btn-border-anim {
  position: relative;
}

.btn-border-anim::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-primary);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-border-anim:hover::before {
  opacity: 1;
  animation: border-rotate 2s linear infinite;
}

@keyframes border-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 7.2 输入框微交互

```css
/* === 输入框聚焦动画 === */
.input-focus-line {
  position: relative;
}

.input-focus-line::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--gradient-primary);
  transition: all 0.3s var(--ease-out);
}

.input-focus-line:focus::after {
  left: 0;
  width: 100%;
}

/* === 标签浮动效果 === */
.input-float-label {
  position: relative;
}

.input-float-label label {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  pointer-events: none;
  transition: all 0.2s var(--ease-out);
}

.input-float-label input:focus + label,
.input-float-label input:not(:placeholder-shown) + label {
  top: 0;
  font-size: var(--text-xs);
  background: var(--gray-900);
  padding: 0 0.25rem;
  color: var(--primary-400);
}
```

### 7.3 卡片微交互

```css
/* === 3D 倾斜效果 === */
.card-tilt {
  transform-style: preserve-3d;
  perspective: 1000px;
}

.card-tilt:hover {
  transform: rotateX(2deg) rotateY(-2deg);
}

/* === 光标跟随光效 === */
.card-spotlight {
  position: relative;
  overflow: hidden;
}

.card-spotlight::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  transform: translate(-50%, -50%);
}

.card-spotlight:hover::before {
  opacity: 1;
}
```

### 7.4 加载状态

```css
/* === 骨架屏 === */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 37%,
    rgba(255, 255, 255, 0.05) 63%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.5rem;
}

.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.skeleton-image {
  height: 200px;
}

/* === 加载点 === */
.loading-dots {
  display: flex;
  gap: 0.25rem;
}

.loading-dots span {
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
  border-radius: 50%;
  animation: loading-dot 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0; }

@keyframes loading-dot {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* === 进度条 === */
.progress {
  height: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: inherit;
  transition: width 0.3s var(--ease-out);
}

.progress-bar-animated {
  position: relative;
  overflow: hidden;
}

.progress-bar-animated::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

---

## 响应式优化

### 8.1 断点系统

```css
:root {
  /* === 断点定义 === */
  --breakpoint-xs: 320px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* === 容器查询 === */
.container-query {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .cq-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (min-width: 600px) {
  .cq-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 8.2 移动端优化

```css
/* === 触摸友好间距 === */
@media (max-width: 768px) {
  .btn {
    min-height: 44px; /* iOS 推荐最小触摸目标 */
    min-width: 44px;
  }
  
  .input {
    font-size: 16px; /* 防止 iOS 自动缩放 */
  }
  
  .card {
    --card-padding: 1rem;
  }
  
  /* 增加链接点击区域 */
  .touch-target {
    position: relative;
  }
  
  .touch-target::before {
    content: '';
    position: absolute;
    inset: -8px;
  }
}

/* === 安全区域 === */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-right {
  padding-right: env(safe-area-inset-right);
}

/* === 横屏优化 === */
@media (orientation: landscape) and (max-height: 500px) {
  .hero {
    min-height: auto;
    padding: 2rem 0;
  }
}
```

### 8.3 间距系统

```css
:root {
  /* === 间距 Scale === */
  --space-0: 0;
  --space-px: 1px;
  --space-0.5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1.5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2.5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3.5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
  --space-36: 9rem;       /* 144px */
  --space-40: 10rem;      /* 160px */
  --space-44: 11rem;      /* 176px */
  --space-48: 12rem;      /* 192px */
  --space-52: 13rem;      /* 208px */
  --space-56: 14rem;      /* 224px */
  --space-60: 15rem;      /* 240px */
  --space-64: 16rem;      /* 256px */
  --space-72: 18rem;      /* 288px */
  --space-80: 20rem;      /* 320px */
  --space-96: 24rem;      /* 384px */
}

/* === 响应式间距 === */
.section-spacing {
  padding-top: var(--space-16);
  padding-bottom: var(--space-16);
}

@media (min-width: 768px) {
  .section-spacing {
    padding-top: var(--space-24);
    padding-bottom: var(--space-24);
  }
}

@media (min-width: 1024px) {
  .section-spacing {
    padding-top: var(--space-32);
    padding-bottom: var(--space-32);
  }
}
```

---

## 深色模式优化

### 9.1 深色模式颜色

```css
.dark {
  /* === 背景色 === */
  --bg-primary: #0a0f1a;
  --bg-secondary: #0f1629;
  --bg-tertiary: #141c33;
  --bg-elevated: #1a2340;
  --bg-surface: rgba(255, 255, 255, 0.03);
  --bg-hover: rgba(255, 255, 255, 0.06);
  --bg-active: rgba(255, 255, 255, 0.08);
  
  /* === 文字色 === */
  --text-primary: #f1f5f9;
  --text-secondary: rgba(241, 245, 249, 0.7);
  --text-tertiary: rgba(241, 245, 249, 0.5);
  --text-muted: rgba(241, 245, 249, 0.4);
  
  /* === 边框色 === */
  --border-default: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.12);
  --border-focus: rgba(32, 128, 255, 0.5);
  
  /* === 阴影 === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.6);
}
```

### 9.2 深色模式组件适配

```css
.dark {
  /* === 卡片 === */
  .card {
    --card-bg: var(--bg-surface);
    --card-border: var(--border-default);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.05),
      0 10px 40px -20px rgba(0, 0, 0, 0.5);
  }
  
  .card:hover {
    --card-bg: var(--bg-hover);
    --card-border: var(--border-hover);
  }
  
  /* === 输入框 === */
  .input {
    --input-bg: var(--bg-surface);
    --input-border: var(--border-default);
    color: var(--text-primary);
  }
  
  .input::placeholder {
    color: var(--text-muted);
  }
  
  .input:focus {
    --input-border: var(--border-focus);
    box-shadow: 
      0 0 0 3px rgba(32, 128, 255, 0.2),
      0 0 20px rgba(32, 128, 255, 0.1);
  }
  
  /* === 按钮 === */
  .btn-secondary {
    background: var(--bg-surface);
    border-color: var(--border-default);
    color: var(--text-primary);
  }
  
  .btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }
  
  .btn-ghost {
    color: var(--text-secondary);
  }
  
  .btn-ghost:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}
```

### 9.3 平滑主题切换

```css
/* === 主题切换过渡 === */
html {
  transition: background-color 0.3s var(--ease-smooth),
              color 0.3s var(--ease-smooth);
}

html.theme-transitioning * {
  transition: background-color 0.3s var(--ease-smooth),
              color 0.3s var(--ease-smooth),
              border-color 0.3s var(--ease-smooth),
              box-shadow 0.3s var(--ease-smooth);
}
```

---

## 可访问性增强

### 10.1 焦点样式

```css
/* === 全局焦点样式 === */
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* === 按钮焦点 === */
.btn:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--primary-500);
}

/* === 输入框焦点 === */
.input:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--primary-500);
}

/* === 卡片焦点 === */
.card:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--primary-500);
}

/* === 跳过链接 === */
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-500);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  z-index: 9999;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 1rem;
}
```

### 10.2 减少动画

```css
/* === 减少动画偏好 === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .animate-float,
  .animate-bounce,
  .animate-pulse {
    animation: none !important;
  }
}
```

### 10.3 对比度增强

```css
/* === 高对比度模式 === */
@media (prefers-contrast: high) {
  :root {
    --text-secondary: rgba(255, 255, 255, 0.9);
    --text-tertiary: rgba(255, 255, 255, 0.8);
    --border-default: rgba(255, 255, 255, 0.3);
  }
  
  .btn {
    border-width: 2px;
  }
  
  .card {
    border-width: 2px;
  }
}
```

### 10.4 屏幕阅读器

```css
/* === 仅屏幕阅读器可见 === */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* === 聚焦时显示 === */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* === 实时区域 === */
.live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 实施计划

### Phase 1: 基础升级 (Week 1)

```markdown
1. 更新 CSS 变量系统
   - 新增颜色变量
   - 新增渐变变量
   - 新增间距变量
   - 新增字体变量

2. 升级 Tailwind 配置
   - 扩展主题配置
   - 添加自定义插件
   - 配置动画

3. 基础组件升级
   - Button 组件
   - Input 组件
   - Card 组件
```

### Phase 2: 组件系统 (Week 2)

```markdown
1. 徽章组件升级
2. 提示框组件升级
3. 模态框组件升级
4. 表格组件升级
5. 导航组件升级
```

### Phase 3: 动效系统 (Week 3)

```markdown
1. 添加页面过渡动画
2. 实现微交互效果
3. 添加骨架屏
4. 添加加载动画
```

### Phase 4: 优化完善 (Week 4)

```markdown
1. 响应式测试与优化
2. 深色模式完善
3. 可访问性审计
4. 性能优化
5. 文档完善
```

---

## 代码示例

### 新版按钮使用

```tsx
// Primary 按钮
<button className="btn btn-primary btn-lg btn-ripple">
  开始创建
</button>

// 带图标的按钮
<button className="btn btn-secondary">
  <IconPlus className="w-4 h-4" />
  新建项目
</button>

// 加载状态
<button className="btn btn-primary btn-loading" disabled>
  处理中...
</button>
```

### 新版卡片使用

```tsx
// 玻璃态卡片
<div className="card card-glass card-hover">
  <h3 className="heading-3">卡片标题</h3>
  <p className="body-base text-secondary">卡片内容</p>
</div>

// 发光边框卡片
<div className="card card-glow">
  <h3 className="heading-3">Premium 功能</h3>
  <p className="body-base text-secondary">解锁更多能力</p>
</div>
```

### 动画使用

```tsx
// 交错动画列表
<div className="stagger-children">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>

// 浮动效果
<div className="animate-float">
  <Logo />
</div>

// 发光效果
<div className="animate-glow">
  <Badge>NEW</Badge>
</div>
```

---

## 总结

本次设计系统升级涵盖以下核心改进：

| 模块 | 改进点 | 体验提升 |
|------|--------|----------|
| 色彩系统 | 丰富渐变、语义化颜色 | 视觉层次更清晰 |
| 字体排版 | 流式缩放、清晰层级 | 阅读体验更好 |
| 组件系统 | 统一风格、多变体 | 品牌感更强 |
| 动效系统 | 丰富动画、平滑过渡 | 交互更流畅 |
| 微交互 | 细腻反馈、情感化设计 | 操作更愉悦 |
| 响应式 | 触摸优化、安全区域 | 移动体验更好 |
| 深色模式 | 精细调色、平滑切换 | 夜间体验更佳 |
| 可访问性 | 焦点管理、动画减少 | 包容性更强 |

---

**文档版本**: v2.0.0  
**最后更新**: 2026-01-25  
**维护者**: Sora2Ai Design Team
