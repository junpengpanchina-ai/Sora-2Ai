# UI/UX 设计规范文档

## 1. 设计原则

### 1.1 核心设计理念
- **简洁优雅**：界面保持简洁，避免不必要的视觉干扰
- **用户友好**：操作流程直观，减少用户学习成本
- **响应式设计**：适配各种屏幕尺寸，确保移动端和桌面端体验一致
- **可访问性**：遵循 WCAG 2.1 AA 标准，确保所有用户都能使用
- **性能优先**：优化加载速度，提供流畅的交互体验

### 1.2 视觉层次
- **主次分明**：重要信息突出显示，次要信息适当弱化
- **一致性**：相同功能的元素保持一致的视觉样式
- **留白艺术**：合理使用留白，提升内容的可读性
- **渐进式披露**：复杂功能分步骤展示，避免信息过载

### 1.3 交互原则
- **即时反馈**：所有操作都应提供明确的视觉反馈
- **错误预防**：通过验证和提示，减少用户错误操作
- **容错性**：提供撤销和重做功能，允许用户纠正错误
- **加载状态**：长时间操作显示加载动画和进度提示

## 2. 颜色方案

### 2.1 主色调（Primary Colors）

#### 品牌色 - Indigo
```css
--color-indigo-50: #eef2ff
--color-indigo-100: #e0e7ff
--color-indigo-200: #c7d2fe
--color-indigo-300: #a5b4fc
--color-indigo-400: #818cf8
--color-indigo-500: #6366f1  /* 主色 */
--color-indigo-600: #4f46e5  /* 主要按钮、链接 */
--color-indigo-700: #4338ca  /* 悬停状态 */
--color-indigo-800: #3730a3
--color-indigo-900: #312e81
```

#### 辅助色 - Blue
```css
--color-blue-50: #eff6ff
--color-blue-100: #dbeafe
--color-blue-500: #3b82f6
--color-blue-600: #2563eb
```

### 2.2 功能色（Functional Colors）

#### 成功（Success）
```css
--color-success-50: #f0fdf4
--color-success-100: #dcfce7
--color-success-500: #22c55e
--color-success-600: #16a34a
--color-success-700: #15803d
```

#### 警告（Warning）
```css
--color-warning-50: #fffbeb
--color-warning-100: #fef3c7
--color-warning-500: #f59e0b
--color-warning-600: #d97706
--color-warning-700: #b45309
```

#### 错误（Error）
```css
--color-error-50: #fef2f2
--color-error-100: #fee2e2
--color-error-500: #ef4444
--color-error-600: #dc2626
--color-error-700: #b91c1c
```

#### 信息（Info）
```css
--color-info-50: #eff6ff
--color-info-100: #dbeafe
--color-info-500: #3b82f6
--color-info-600: #2563eb
--color-info-700: #1d4ed8
```

### 2.3 中性色（Neutral Colors）

#### 浅色模式（Light Mode）
```css
--color-gray-50: #f9fafb   /* 背景色 */
--color-gray-100: #f3f4f6  /* 次要背景 */
--color-gray-200: #e5e7eb  /* 边框 */
--color-gray-300: #d1d5db
--color-gray-400: #9ca3af  /* 禁用文本 */
--color-gray-500: #6b7280  /* 次要文本 */
--color-gray-600: #4b5563  /* 正文文本 */
--color-gray-700: #374151  /* 标题文本 */
--color-gray-800: #1f2937  /* 强调文本 */
--color-gray-900: #111827  /* 主要文本 */
```

#### 深色模式（Dark Mode）
```css
--color-gray-50: #111827   /* 主要文本 */
--color-gray-100: #1f2937  /* 强调文本 */
--color-gray-200: #374151  /* 标题文本 */
--color-gray-300: #4b5563  /* 正文文本 */
--color-gray-400: #6b7280  /* 次要文本 */
--color-gray-500: #9ca3af  /* 禁用文本 */
--color-gray-600: #d1d5db
--color-gray-700: #e5e7eb  /* 边框 */
--color-gray-800: #f3f4f6  /* 次要背景 */
--color-gray-900: #f9fafb  /* 背景色 */
```

### 2.4 渐变方案（Gradients）

#### 背景渐变
```css
/* 主背景渐变 */
background: linear-gradient(to bottom right, 
  var(--color-blue-50), 
  var(--color-indigo-100));

/* 深色模式背景渐变 */
background: linear-gradient(to bottom right, 
  var(--color-gray-900), 
  var(--color-gray-800));
```

#### 按钮渐变（可选）
```css
/* 主要按钮渐变 */
background: linear-gradient(135deg, 
  var(--color-indigo-600), 
  var(--color-indigo-700));
```

### 2.5 颜色使用规范

| 用途 | 颜色 | 使用场景 |
|------|------|----------|
| 主要按钮 | Indigo-600 | 主要操作按钮 |
| 次要按钮 | Gray-200/Gray-700 | 次要操作按钮 |
| 危险操作 | Red-600 | 删除、注销等 |
| 成功提示 | Green-600 | 成功消息、完成状态 |
| 警告提示 | Yellow-500 | 警告消息 |
| 错误提示 | Red-600 | 错误消息 |
| 信息提示 | Blue-600 | 信息消息 |
| 链接 | Indigo-600 | 文本链接 |
| 边框 | Gray-200/Gray-700 | 卡片、输入框边框 |
| 背景 | Gray-50/Gray-900 | 页面背景 |

## 3. 组件设计规范

### 3.1 按钮（Button）

#### 主要按钮（Primary Button）
```tsx
className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold 
  text-white transition-colors hover:bg-indigo-700 
  focus-visible:outline focus-visible:outline-2 
  focus-visible:outline-offset-2 focus-visible:outline-indigo-600 
  disabled:opacity-50 disabled:cursor-not-allowed"
```

**规格：**
- 圆角：`rounded-lg` (8px)
- 内边距：`px-4 py-2` (16px 水平，8px 垂直)
- 字体：`text-sm font-semibold`
- 颜色：背景 `indigo-600`，悬停 `indigo-700`
- 禁用状态：`opacity-50` + `cursor-not-allowed`

#### 次要按钮（Secondary Button）
```tsx
className="rounded-lg bg-white px-4 py-2 text-sm font-semibold 
  text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
  transition-colors hover:bg-gray-50 
  dark:bg-gray-700 dark:text-white dark:ring-gray-600 
  dark:hover:bg-gray-600"
```

#### 危险按钮（Danger Button）
```tsx
className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold 
  text-white transition-colors hover:bg-red-700 
  focus-visible:outline focus-visible:outline-2 
  focus-visible:outline-offset-2 focus-visible:outline-red-600"
```

#### 按钮尺寸
- **小号（Small）**：`px-3 py-1.5 text-xs`
- **中号（Medium）**：`px-4 py-2 text-sm`（默认）
- **大号（Large）**：`px-6 py-3 text-base`

### 3.2 输入框（Input）

#### 文本输入框
```tsx
className="w-full rounded-md border border-gray-300 px-3 py-2 
  text-gray-900 shadow-sm focus:border-indigo-500 
  focus:outline-none focus:ring-indigo-500 
  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
```

**规格：**
- 圆角：`rounded-md` (6px)
- 边框：`border border-gray-300`
- 内边距：`px-3 py-2`
- 焦点状态：`focus:border-indigo-500 focus:ring-indigo-500`

#### 文本域（Textarea）
```tsx
className="w-full rounded-md border border-gray-300 px-3 py-2 
  text-gray-900 shadow-sm focus:border-indigo-500 
  focus:outline-none focus:ring-indigo-500 
  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
```

### 3.3 卡片（Card）

#### 基础卡片
```tsx
className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
```

**规格：**
- 圆角：`rounded-lg` (8px)
- 内边距：`p-6` (24px)
- 阴影：`shadow-lg`
- 背景：浅色模式 `white`，深色模式 `gray-800`

#### 带边框卡片
```tsx
className="rounded-lg border border-gray-200 bg-white p-6 
  dark:border-gray-700 dark:bg-gray-800"
```

### 3.4 导航栏（Navigation）

#### 顶部导航栏
```tsx
className="border-b border-gray-200 bg-white/80 backdrop-blur-sm 
  dark:border-gray-700 dark:bg-gray-800/80"
```

**规格：**
- 背景：半透明 `bg-white/80` + 毛玻璃效果 `backdrop-blur-sm`
- 边框：底部边框 `border-b`
- 高度：`h-16` (64px)

#### 导航链接
```tsx
className="text-sm font-medium text-gray-700 hover:text-gray-900 
  dark:text-gray-300 dark:hover:text-white"
```

### 3.5 状态标签（Badge）

#### 成功状态
```tsx
className="inline-flex items-center rounded-full px-2.5 py-0.5 
  text-xs font-medium text-green-600 bg-green-50"
```

#### 错误状态
```tsx
className="inline-flex items-center rounded-full px-2.5 py-0.5 
  text-xs font-medium text-red-600 bg-red-50"
```

#### 处理中状态
```tsx
className="inline-flex items-center rounded-full px-2.5 py-0.5 
  text-xs font-medium text-blue-600 bg-blue-50"
```

### 3.6 进度条（Progress Bar）

```tsx
<div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
  <div
    className="h-3 rounded-full bg-indigo-600 transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

**规格：**
- 高度：`h-3` (12px)
- 圆角：`rounded-full`
- 过渡动画：`transition-all duration-300`

### 3.7 提示消息（Alert）

#### 成功提示
```tsx
className="rounded-lg bg-green-50 p-4 text-sm text-green-800 
  dark:bg-green-900/20 dark:text-green-400"
```

#### 错误提示
```tsx
className="rounded-lg bg-red-50 p-4 text-sm text-red-800 
  dark:bg-red-900/20 dark:text-red-400"
```

#### 警告提示
```tsx
className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 
  dark:bg-yellow-900/20 dark:text-yellow-400"
```

#### 信息提示
```tsx
className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 
  dark:bg-blue-900/20 dark:text-blue-400"
```

### 3.8 模态框（Modal）

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center 
  bg-black/50 backdrop-blur-sm">
  <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
    {/* 内容 */}
  </div>
</div>
```

### 3.9 加载动画（Loading Spinner）

```tsx
<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

## 4. 排版规范

### 4.1 字体大小

| 用途 | Tailwind 类 | 像素值 | 使用场景 |
|------|------------|--------|----------|
| 超大标题 | `text-4xl` | 36px | 页面主标题 |
| 大标题 | `text-3xl` | 30px | 区块标题 |
| 中标题 | `text-2xl` | 24px | 卡片标题 |
| 小标题 | `text-xl` | 20px | 章节标题 |
| 正文 | `text-base` | 16px | 正文内容 |
| 小文本 | `text-sm` | 14px | 辅助信息 |
| 极小文本 | `text-xs` | 12px | 标签、提示 |

### 4.2 字重

- **粗体**：`font-bold` (700) - 标题、强调文本
- **半粗**：`font-semibold` (600) - 按钮、重要文本
- **中等**：`font-medium` (500) - 导航链接
- **常规**：`font-normal` (400) - 正文（默认）

### 4.3 行高

- **标题**：`leading-tight` (1.25)
- **正文**：`leading-normal` (1.5)
- **宽松**：`leading-relaxed` (1.625)

### 4.4 间距系统

使用 Tailwind 的间距系统（基于 4px 的倍数）：

| 用途 | Tailwind 类 | 像素值 | 使用场景 |
|------|------------|--------|----------|
| 极小间距 | `gap-1` / `space-y-1` | 4px | 紧密排列的元素 |
| 小间距 | `gap-2` / `space-y-2` | 8px | 相关元素 |
| 中间距 | `gap-4` / `space-y-4` | 16px | 默认间距 |
| 大间距 | `gap-6` / `space-y-6` | 24px | 区块间距 |
| 超大间距 | `gap-8` / `space-y-8` | 32px | 主要区块间距 |

## 5. 响应式设计

### 5.1 断点（Breakpoints）

| 设备 | Tailwind 前缀 | 最小宽度 | 使用场景 |
|------|-------------|----------|----------|
| 移动端 | 默认 | < 640px | 手机 |
| 平板 | `sm:` | ≥ 640px | 平板竖屏 |
| 桌面 | `md:` | ≥ 768px | 平板横屏、小桌面 |
| 大桌面 | `lg:` | ≥ 1024px | 桌面显示器 |
| 超大桌面 | `xl:` | ≥ 1280px | 大显示器 |

### 5.2 响应式布局示例

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* 移动端：1列，平板：2列，桌面：3列 */}
</div>
```

## 6. 动画与过渡

### 6.1 过渡效果

```css
/* 颜色过渡 */
transition-colors duration-200

/* 所有属性过渡 */
transition-all duration-300

/* 变换过渡 */
transition-transform duration-200
```

### 6.2 常用动画

- **淡入**：`animate-fade-in`
- **滑入**：`animate-slide-in`
- **旋转**：`animate-spin`（用于加载动画）
- **脉冲**：`animate-pulse`（用于骨架屏）

## 7. 可访问性（Accessibility）

### 7.1 键盘导航
- 所有交互元素必须可通过 Tab 键访问
- 焦点状态必须清晰可见
- 使用 `focus-visible:outline` 显示焦点

### 7.2 ARIA 标签
- 按钮：使用 `aria-label` 描述操作
- 表单：使用 `aria-describedby` 关联错误信息
- 加载状态：使用 `aria-live="polite"` 通知屏幕阅读器

### 7.3 颜色对比度
- 正文文本与背景对比度 ≥ 4.5:1
- 大文本（18px+）与背景对比度 ≥ 3:1
- 交互元素与背景对比度 ≥ 3:1

## 8. 深色模式（Dark Mode）

### 8.1 实现方式
使用 Tailwind 的 `dark:` 前缀实现深色模式：

```tsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

### 8.2 颜色映射

| 浅色模式 | 深色模式 | 用途 |
|---------|---------|------|
| `white` | `gray-800` | 卡片背景 |
| `gray-50` | `gray-900` | 页面背景 |
| `gray-900` | `white` | 主要文本 |
| `gray-600` | `gray-400` | 次要文本 |
| `gray-200` | `gray-700` | 边框 |

## 9. 设计令牌（Design Tokens）

### 9.1 圆角（Border Radius）

```css
--radius-sm: 4px    /* rounded */
--radius-md: 6px    /* rounded-md */
--radius-lg: 8px    /* rounded-lg */
--radius-xl: 12px   /* rounded-xl */
--radius-full: 9999px /* rounded-full */
```

### 9.2 阴影（Shadows）

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

### 9.3 过渡时间（Transition Duration）

```css
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms
```

## 10. 最佳实践

### 10.1 组件复用
- 创建可复用的组件库
- 使用一致的命名规范
- 保持组件的单一职责

### 10.2 性能优化
- 使用 CSS 动画而非 JavaScript 动画
- 合理使用 `will-change` 属性
- 避免不必要的重绘和重排

### 10.3 代码组织
- 将样式类按功能分组
- 使用 Tailwind 的 `@apply` 指令创建自定义类
- 保持样式的一致性

## 11. 设计资源

### 11.1 图标
- 使用 Heroicons 图标库
- 图标大小：`h-5 w-5` (20px) 用于按钮，`h-6 w-6` (24px) 用于独立显示

### 11.2 占位符
- 图片占位符：使用 `placeholder.com` 或类似服务
- 骨架屏：使用 `animate-pulse` 创建加载占位符

## 12. 设计检查清单

在实现新功能时，请确保：

- [ ] 遵循颜色方案
- [ ] 使用正确的组件样式
- [ ] 响应式设计已实现
- [ ] 深色模式已支持
- [ ] 可访问性要求已满足
- [ ] 动画过渡流畅
- [ ] 加载状态已处理
- [ ] 错误状态已处理
- [ ] 键盘导航可用
- [ ] 焦点状态清晰

---

**最后更新**：2024年
**维护者**：开发团队

