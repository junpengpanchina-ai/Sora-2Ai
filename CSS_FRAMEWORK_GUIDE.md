# CSS 框架使用指南

本项目使用 Tailwind CSS + 自定义 CSS 变量系统构建完整的样式框架。

## 📦 框架结构

### 1. CSS 变量系统 (`app/globals.css`)

所有设计令牌都通过 CSS 变量定义，方便统一管理和主题切换。

#### 颜色变量
```css
/* 主色调 */
--color-indigo-50 到 --color-indigo-900

/* 功能色 */
--color-success-50, --color-success-500, --color-success-600
--color-warning-50, --color-warning-500, --color-warning-600
--color-error-50, --color-error-500, --color-error-600
--color-info-50, --color-info-500, --color-info-600

/* 中性色 */
--color-gray-50 到 --color-gray-900
```

#### 设计令牌
```css
/* 圆角 */
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px

/* 阴影 */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --shadow-2xl

/* 过渡时间 */
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms

/* 间距 */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

## 🎨 组件样式类

### 按钮样式

```tsx
// 使用组件类
<button className="btn btn-primary">主要按钮</button>
<button className="btn btn-secondary">次要按钮</button>
<button className="btn btn-danger">危险按钮</button>
<button className="btn btn-ghost">幽灵按钮</button>

// 或使用 Tailwind 类（推荐）
<button className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
  按钮
</button>
```

### 输入框样式

```tsx
// 基础输入框
<input className="input" type="text" />

// 错误状态
<input className="input input-error" type="text" />
```

### 卡片样式

```tsx
// 默认卡片
<div className="card">内容</div>

// 带边框卡片
<div className="card-bordered">内容</div>

// 高阴影卡片
<div className="card-elevated">内容</div>
```

### 标签样式

```tsx
<span className="badge badge-success">成功</span>
<span className="badge badge-error">错误</span>
<span className="badge badge-warning">警告</span>
<span className="badge badge-info">信息</span>
<span className="badge badge-default">默认</span>
```

### 提示框样式

```tsx
<div className="alert alert-success">成功消息</div>
<div className="alert alert-error">错误消息</div>
<div className="alert alert-warning">警告消息</div>
<div className="alert alert-info">信息消息</div>
```

### 导航栏样式

```tsx
<nav className="navbar">
  <div className="container">
    {/* 导航内容 */}
  </div>
</nav>
```

### 容器样式

```tsx
<div className="container">
  {/* 内容 */}
</div>
```

### 渐变背景

```tsx
<div className="gradient-bg">
  {/* 内容 */}
</div>
```

## 🛠️ 工具类

### 间距工具类

```tsx
<div className="gap-xs">  {/* gap: 4px */}
<div className="gap-sm">  {/* gap: 8px */}
<div className="gap-md">  {/* gap: 16px */}
<div className="gap-lg">  {/* gap: 24px */}
<div className="gap-xl">  {/* gap: 32px */}
```

### 阴影工具类

```tsx
<div className="shadow-custom-sm">  {/* 小阴影 */}
<div className="shadow-custom-md">  {/* 中阴影 */}
<div className="shadow-custom-lg">  {/* 大阴影 */}
<div className="shadow-custom-xl">  {/* 超大阴影 */}
```

### 过渡工具类

```tsx
<div className="transition-fast">  {/* 150ms */}
<div className="transition-normal">  {/* 200ms */}
<div className="transition-slow">  {/* 300ms */}
```

### 圆角工具类

```tsx
<div className="rounded-custom-sm">  {/* 4px */}
<div className="rounded-custom-md">  {/* 6px */}
<div className="rounded-custom-lg">  {/* 8px */}
<div className="rounded-custom-xl">  {/* 12px */}
```

### 文本截断

```tsx
<p className="truncate-2">两行截断</p>
<p className="truncate-3">三行截断</p>
```

### 玻璃态效果

```tsx
<div className="glass">
  {/* 半透明背景 + 毛玻璃效果 */}
</div>
```

### 渐变文本

```tsx
<h1 className="gradient-text">渐变文字</h1>
```

### 悬浮效果

```tsx
<div className="hover-lift">  {/* 悬浮时上移 */}
<div className="hover-scale">  {/* 悬浮时放大 */}
```

### 骨架屏

```tsx
<div className="skeleton h-4 w-full"></div>
<div className="skeleton h-20 w-20 rounded-full"></div>
```

## 🎯 基础样式 (@layer base)

框架自动为以下元素应用基础样式：

- **标题** (h1-h6): 自动应用字体粗细和颜色
- **链接** (a): 自动应用 Indigo 颜色和悬停效果
- **代码** (code): 自动应用背景和圆角
- **代码块** (pre): 自动应用背景和样式
- **引用** (blockquote): 自动应用左边框和样式

## 🌙 深色模式

框架完全支持深色模式，通过 `.dark` 类切换：

```tsx
// 在根元素添加 dark 类
<html className="dark">
  {/* 所有组件自动适配深色模式 */}
</html>
```

所有颜色、背景、边框都会自动适配深色模式。

## 📝 使用建议

### 1. 优先使用 Tailwind 工具类

```tsx
// ✅ 推荐
<button className="rounded-lg bg-indigo-600 px-4 py-2 text-white">

// ❌ 不推荐（除非需要特殊定制）
<button className="btn btn-primary">
```

### 2. 使用 CSS 变量进行主题定制

```css
/* 在 globals.css 中修改 */
:root {
  --color-indigo-600: #your-color;
}
```

### 3. 组合使用组件类和工具类

```tsx
<div className="card hover-lift">
  <h3 className="gradient-text">标题</h3>
  <p className="truncate-2">内容</p>
</div>
```

### 4. 响应式设计

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
  {/* 响应式网格 */}
</div>
```

## 🎨 颜色使用规范

| 用途 | 颜色类 | CSS 变量 |
|------|--------|----------|
| 主要按钮 | `bg-indigo-600` | `--color-indigo-600` |
| 成功状态 | `bg-green-600` | `--color-success-600` |
| 警告状态 | `bg-yellow-600` | `--color-warning-600` |
| 错误状态 | `bg-red-600` | `--color-error-600` |
| 信息状态 | `bg-blue-600` | `--color-info-600` |

## 📚 完整示例

```tsx
export function ExampleComponent() {
  return (
    <div className="gradient-bg min-h-screen">
      <nav className="navbar">
        <div className="container">
          <h1 className="text-xl font-bold">标题</h1>
        </div>
      </nav>
      
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="card hover-lift">
            <h2 className="gradient-text mb-4">卡片标题</h2>
            <p className="text-gray-600 dark:text-gray-400 truncate-3">
              这是卡片内容，会自动截断超过三行的文本。
            </p>
            <button className="btn btn-primary mt-4">
              操作按钮
            </button>
          </div>
          
          <div className="card-bordered">
            <span className="badge badge-success">成功</span>
            <div className="alert alert-info mt-4">
              这是一条信息提示
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

## 🔧 自定义扩展

### 添加新的工具类

在 `app/globals.css` 的 `@layer utilities` 中添加：

```css
@layer utilities {
  .your-custom-class {
    @apply /* Tailwind classes */;
  }
}
```

### 添加新的组件样式

在 `app/globals.css` 的 `@layer components` 中添加：

```css
@layer components {
  .your-component {
    @apply /* Tailwind classes */;
  }
}
```

## 📖 相关文档

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [UI/UX 设计规范](./UI_UX_DESIGN.md)
- [组件库使用指南](./components/ui/README.md)

