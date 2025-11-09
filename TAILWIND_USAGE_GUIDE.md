# Tailwind CSS 工具类使用指南

本指南详细介绍如何在项目中使用 Tailwind CSS 工具类进行样式开发。

## 📚 目录

1. [基础概念](#基础概念)
2. [常用工具类](#常用工具类)
3. [响应式设计](#响应式设计)
4. [深色模式](#深色模式)
5. [状态变体](#状态变体)
6. [组合使用](#组合使用)
7. [最佳实践](#最佳实践)
8. [完整示例](#完整示例)

## 🎯 基础概念

### 工具类命名规则

Tailwind 使用功能性的类名，格式为：`{属性}-{值}`

```tsx
// 示例
<div className="bg-indigo-600">  // background-color: indigo-600
<div className="px-4">            // padding-left & padding-right: 1rem
<div className="rounded-lg">      // border-radius: 0.5rem
```

### 值的大小

Tailwind 使用数字系统，通常基于 4px 的倍数：

```tsx
// 间距示例
<div className="p-1">   {/* padding: 4px */}
<div className="p-2">   {/* padding: 8px */}
<div className="p-4">   {/* padding: 16px */}
<div className="p-6">   {/* padding: 24px */}
<div className="p-8">   {/* padding: 32px */}
```

## 🎨 常用工具类

### 布局 (Layout)

#### Flexbox

```tsx
// 基础 Flex 容器
<div className="flex">                    {/* display: flex */}
<div className="flex-col">                {/* flex-direction: column */}
<div className="items-center">            {/* align-items: center */}
<div className="justify-between">        {/* justify-content: space-between */}
<div className="gap-4">                   {/* gap: 1rem */}

// 完整示例
<div className="flex items-center justify-between gap-4">
  <span>左侧</span>
  <span>右侧</span>
</div>
```

#### Grid

```tsx
// Grid 布局
<div className="grid">                   {/* display: grid */}
<div className="grid-cols-3">            {/* grid-template-columns: repeat(3, minmax(0, 1fr)) */}
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">  {/* 响应式 */}
<div className="gap-4">                   {/* gap: 1rem */}

// 完整示例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>卡片 1</div>
  <div>卡片 2</div>
  <div>卡片 3</div>
</div>
```

#### 定位

```tsx
<div className="relative">                {/* position: relative */}
<div className="absolute">               {/* position: absolute */}
<div className="fixed">                  {/* position: fixed */}
<div className="sticky top-0">          {/* position: sticky */}
<div className="inset-0">                {/* top/right/bottom/left: 0 */}
<div className="z-50">                   {/* z-index: 50 */}
```

### 间距 (Spacing)

```tsx
// Padding
<div className="p-4">                    {/* padding: 1rem */}
<div className="px-4">                  {/* padding-left & right: 1rem */}
<div className="py-4">                  {/* padding-top & bottom: 1rem */}
<div className="pt-4">                  {/* padding-top: 1rem */}
<div className="pb-4">                  {/* padding-bottom: 1rem */}
<div className="pl-4">                   {/* padding-left: 1rem */}
<div className="pr-4">                  {/* padding-right: 1rem */}

// Margin
<div className="m-4">                    {/* margin: 1rem */}
<div className="mx-auto">                {/* margin-left & right: auto (居中) */}
<div className="mt-4">                   {/* margin-top: 1rem */}
<div className="mb-4">                   {/* margin-bottom: 1rem */}
<div className="space-y-4">              {/* 子元素垂直间距 */}
<div className="space-x-4">             {/* 子元素水平间距 */}
```

### 尺寸 (Sizing)

```tsx
// 宽度
<div className="w-full">                 {/* width: 100% */}
<div className="w-1/2">                 {/* width: 50% */}
<div className="w-64">                  {/* width: 16rem */}
<div className="w-auto">                {/* width: auto */}
<div className="w-fit">                 {/* width: fit-content */}
<div className="w-screen">              {/* width: 100vw */}
<div className="max-w-7xl">             {/* max-width: 80rem */}
<div className="min-w-0">               {/* min-width: 0 */}

// 高度
<div className="h-full">                {/* height: 100% */}
<div className="h-screen">              {/* height: 100vh */}
<div className="h-64">                  {/* height: 16rem */}
<div className="min-h-screen">          {/* min-height: 100vh */}
```

### 颜色 (Colors)

#### 背景色

```tsx
// 主色调
<div className="bg-indigo-600">          {/* background: indigo-600 */}
<div className="bg-indigo-50">         {/* background: indigo-50 */}

// 功能色
<div className="bg-green-600">         {/* success */}
<div className="bg-red-600">           {/* error */}
<div className="bg-yellow-500">         {/* warning */}
<div className="bg-blue-600">          {/* info */}

// 中性色
<div className="bg-white">             {/* white */}
<div className="bg-gray-100">           {/* light gray */}
<div className="bg-gray-900">           {/* dark gray */}
<div className="bg-transparent">        {/* transparent */}
```

#### 文本颜色

```tsx
<div className="text-gray-900">         {/* 主要文本 */}
<div className="text-gray-600">         {/* 次要文本 */}
<div className="text-gray-400">         {/* 禁用文本 */}
<div className="text-indigo-600">       {/* 链接色 */}
<div className="text-white">            {/* 白色文本 */}
```

#### 边框颜色

```tsx
<div className="border border-gray-200">        {/* 边框 */}
<div className="border-2 border-indigo-600">    {/* 2px 边框 */}
<div className="border-t border-gray-200">      {/* 顶部边框 */}
<div className="border-b border-gray-200">      {/* 底部边框 */}
```

### 圆角 (Border Radius)

```tsx
<div className="rounded">               {/* border-radius: 0.25rem */}
<div className="rounded-md">            {/* border-radius: 0.375rem */}
<div className="rounded-lg">            {/* border-radius: 0.5rem */}
<div className="rounded-xl">            {/* border-radius: 0.75rem */}
<div className="rounded-full">          {/* border-radius: 9999px */}
<div className="rounded-t-lg">          {/* 顶部圆角 */}
<div className="rounded-b-lg">          {/* 底部圆角 */}
```

### 阴影 (Shadows)

```tsx
<div className="shadow-sm">             {/* 小阴影 */}
<div className="shadow">                {/* 默认阴影 */}
<div className="shadow-md">             {/* 中等阴影 */}
<div className="shadow-lg">             {/* 大阴影 */}
<div className="shadow-xl">             {/* 超大阴影 */}
<div className="shadow-2xl">             {/* 最大阴影 */}
<div className="shadow-none">           {/* 无阴影 */}
```

### 字体 (Typography)

```tsx
// 字体大小
<p className="text-xs">                 {/* 12px */}
<p className="text-sm">                 {/* 14px */}
<p className="text-base">               {/* 16px */}
<p className="text-lg">                 {/* 18px */}
<p className="text-xl">                 {/* 20px */}
<p className="text-2xl">                {/* 24px */}
<p className="text-3xl">                {/* 30px */}
<p className="text-4xl">                {/* 36px */}

// 字体粗细
<p className="font-thin">               {/* 100 */}
<p className="font-light">              {/* 300 */}
<p className="font-normal">             {/* 400 */}
<p className="font-medium">             {/* 500 */}
<p className="font-semibold">           {/* 600 */}
<p className="font-bold">               {/* 700 */}

// 文本对齐
<p className="text-left">               {/* text-align: left */}
<p className="text-center">             {/* text-align: center */}
<p className="text-right">              {/* text-align: right */}
<p className="text-justify">            {/* text-align: justify */}

// 文本装饰
<p className="underline">               {/* text-decoration: underline */}
<p className="line-through">           {/* text-decoration: line-through */}
<p className="no-underline">           {/* text-decoration: none */}

// 文本截断
<p className="truncate">                {/* 单行截断 */}
<p className="line-clamp-2">           {/* 多行截断（2行） */}
<p className="line-clamp-3">            {/* 多行截断（3行） */}
```

### 显示 (Display)

```tsx
<div className="block">                 {/* display: block */}
<div className="inline">                {/* display: inline */}
<div className="inline-block">          {/* display: inline-block */}
<div className="flex">                  {/* display: flex */}
<div className="grid">                  {/* display: grid */}
<div className="hidden">                {/* display: none */}
```

### 溢出 (Overflow)

```tsx
<div className="overflow-auto">         {/* overflow: auto */}
<div className="overflow-hidden">      {/* overflow: hidden */}
<div className="overflow-scroll">       {/* overflow: scroll */}
<div className="overflow-x-auto">       {/* overflow-x: auto */}
<div className="overflow-y-auto">       {/* overflow-y: auto */}
```

## 📱 响应式设计

Tailwind 使用移动优先的响应式设计，默认样式应用于移动端，使用前缀指定更大屏幕的样式。

### 断点系统

```tsx
// 默认: < 640px (移动端)
<div className="text-sm">

// sm: ≥ 640px (平板竖屏)
<div className="sm:text-base">

// md: ≥ 768px (平板横屏)
<div className="md:text-lg">

// lg: ≥ 1024px (桌面)
<div className="lg:text-xl">

// xl: ≥ 1280px (大桌面)
<div className="xl:text-2xl">

// 2xl: ≥ 1536px (超大桌面)
<div className="2xl:text-3xl">
```

### 响应式示例

```tsx
// 响应式网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 移动端: 1列, 平板: 2列, 桌面: 3列, 大桌面: 4列 */}
</div>

// 响应式间距
<div className="p-4 md:p-6 lg:p-8">
  {/* 移动端: 16px, 平板: 24px, 桌面: 32px */}
</div>

// 响应式显示
<div className="hidden md:block">
  {/* 移动端隐藏, 平板及以上显示 */}
</div>

<div className="block md:hidden">
  {/* 移动端显示, 平板及以上隐藏 */}
</div>
```

## 🌙 深色模式

使用 `dark:` 前缀为深色模式添加样式。

```tsx
// 基础用法
<div className="bg-white dark:bg-gray-800">
<div className="text-gray-900 dark:text-white">
<div className="border-gray-200 dark:border-gray-700">

// 完整示例
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-6">
  内容
</div>
```

### 深色模式颜色映射

```tsx
// 背景
bg-white → dark:bg-gray-800
bg-gray-50 → dark:bg-gray-900
bg-gray-100 → dark:bg-gray-800

// 文本
text-gray-900 → dark:text-white
text-gray-600 → dark:text-gray-400
text-gray-500 → dark:text-gray-400

// 边框
border-gray-200 → dark:border-gray-700
border-gray-300 → dark:border-gray-600
```

## 🎭 状态变体

### 悬停 (Hover)

```tsx
<button className="bg-indigo-600 hover:bg-indigo-700">
  按钮
</button>

<a className="text-indigo-600 hover:text-indigo-700">
  链接
</a>

<div className="hover:shadow-lg transition-shadow">
  卡片
</div>
```

### 焦点 (Focus)

```tsx
<input className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />

<button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
  按钮
</button>
```

### 激活 (Active)

```tsx
<button className="active:scale-95 transition-transform">
  按钮
</button>
```

### 禁用 (Disabled)

```tsx
<button className="disabled:opacity-50 disabled:cursor-not-allowed">
  按钮
</button>

<input className="disabled:bg-gray-50 disabled:text-gray-500" />
```

### 选中 (Selected)

```tsx
<option className="selected:bg-indigo-600 selected:text-white">
  选项
</option>
```

## 🔗 组合使用

### 常用组合模式

#### 卡片组件

```tsx
<div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
    标题
  </h3>
  <p className="text-gray-600 dark:text-gray-400">
    内容
  </p>
</div>
```

#### 按钮组件

```tsx
// 主要按钮
<button className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  按钮
</button>

// 次要按钮
<button className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 transition-colors">
  按钮
</button>
```

#### 输入框组件

```tsx
<input
  type="text"
  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors"
/>
```

#### 导航栏

```tsx
<nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex h-16 items-center justify-between">
      {/* 内容 */}
    </div>
  </div>
</nav>
```

#### 容器布局

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  {/* 内容 */}
</div>
```

## ✨ 最佳实践

### 1. 使用语义化的类名组合

```tsx
// ✅ 好的做法：清晰的类名组合
<button className="btn-primary">
  {/* 使用组件或提取为类 */}
</button>

// 或者提取常用组合
const buttonStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors"
<button className={`${buttonStyles} bg-indigo-600 text-white hover:bg-indigo-700`}>
  按钮
</button>
```

### 2. 使用 cn() 工具函数合并类名

```tsx
import { cn } from '@/lib/utils'

<button className={cn(
  "base-button-styles",
  isActive && "bg-indigo-700",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  按钮
</button>
```

### 3. 响应式设计优先

```tsx
// ✅ 移动优先
<div className="p-4 md:p-6 lg:p-8">

// ❌ 避免桌面优先
<div className="p-8 lg:p-6 md:p-4">
```

### 4. 保持一致性

```tsx
// ✅ 使用统一的间距系统
<div className="space-y-4">
  <div className="p-4">内容 1</div>
  <div className="p-4">内容 2</div>
</div>

// ✅ 使用统一的颜色系统
<button className="bg-indigo-600 hover:bg-indigo-700">
  按钮
</button>
```

### 5. 合理使用深色模式

```tsx
// ✅ 总是考虑深色模式
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ 避免只考虑浅色模式
<div className="bg-white text-gray-900">
```

## 📋 完整示例

### 示例 1: 统计卡片

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
      总任务数
    </p>
    <p className="text-3xl font-bold text-gray-900 dark:text-white">
      42
    </p>
  </div>
  
  <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
      成功生成
    </p>
    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
      38
    </p>
  </div>
</div>
```

### 示例 2: 表单

```tsx
<form className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      提示词
    </label>
    <textarea
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      rows={4}
    />
  </div>
  
  <div className="flex items-center gap-4">
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
    >
      提交
    </button>
    
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 transition-colors"
    >
      取消
    </button>
  </div>
</form>
```

### 示例 3: 任务列表

```tsx
<div className="space-y-4">
  {tasks.map((task) => (
    <div
      key={task.id}
      className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
          {task.prompt}
        </p>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            task.status === 'succeeded' 
              ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : task.status === 'failed'
              ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
              : 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
          }`}>
            {task.status}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(task.created_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  ))}
</div>
```

## 🎓 学习资源

- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Tailwind CSS 速查表](https://tailwindcomponents.com/cheatsheet/)
- [Tailwind UI 组件](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/) - 无样式 UI 组件

## 💡 提示

1. **使用 VS Code 扩展**: 安装 "Tailwind CSS IntelliSense" 获得自动补全
2. **使用浏览器工具**: 安装 "Tailwind CSS DevTools" 查看类名
3. **定期清理**: 使用 `purge` 配置移除未使用的样式
4. **提取组件**: 将重复的类名组合提取为组件或函数

---

**记住**: Tailwind 的核心思想是"实用优先"，通过组合小的工具类来构建复杂的界面。保持简洁，保持一致性！

