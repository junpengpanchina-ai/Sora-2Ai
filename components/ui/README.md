# UI 组件库使用指南

本目录包含项目中的所有可复用 UI 组件，遵循统一的设计规范。

## 安装依赖

组件库需要以下依赖：

```bash
npm install clsx tailwind-merge
```

## 组件列表

### Button（按钮）

基础按钮组件，支持多种变体和尺寸。

```tsx
import { Button } from '@/components/ui'

// 主要按钮
<Button variant="primary" size="md">
  点击我
</Button>

// 次要按钮
<Button variant="secondary">
  取消
</Button>

// 危险按钮
<Button variant="danger">
  删除
</Button>

// 加载状态
<Button isLoading>
  提交中...
</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'` - 按钮变体
- `size`: `'sm' | 'md' | 'lg'` - 按钮尺寸
- `isLoading`: `boolean` - 是否显示加载状态
- 其他标准 HTML button 属性

### Card（卡片）

用于展示内容的容器组件。

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

<Card variant="default">
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
</Card>

// 带边框的卡片
<Card variant="bordered">
  <CardContent>内容</CardContent>
</Card>
```

**Props:**
- `variant`: `'default' | 'bordered' | 'elevated'` - 卡片样式

### Input（输入框）

文本输入框组件，支持标签、错误提示和帮助文本。

```tsx
import { Input } from '@/components/ui'

// 基础输入框
<Input
  label="用户名"
  placeholder="请输入用户名"
  required
/>

// 带错误提示
<Input
  label="邮箱"
  type="email"
  error="请输入有效的邮箱地址"
/>

// 带帮助文本
<Input
  label="密码"
  type="password"
  helperText="密码长度至少 8 位"
/>
```

**Props:**
- `label`: `string` - 标签文本
- `error`: `string` - 错误消息
- `helperText`: `string` - 帮助文本
- 其他标准 HTML input 属性

### Textarea（文本域）

多行文本输入组件。

```tsx
import { Textarea } from '@/components/ui'

<Textarea
  label="描述"
  rows={4}
  placeholder="请输入描述"
  required
/>

<Textarea
  label="评论"
  error="评论不能为空"
/>
```

**Props:**
- `label`: `string` - 标签文本
- `error`: `string` - 错误消息
- `helperText`: `string` - 帮助文本
- 其他标准 HTML textarea 属性

### Badge（标签）

用于显示状态或分类的标签组件。

```tsx
import { Badge } from '@/components/ui'

<Badge variant="success">成功</Badge>
<Badge variant="error">失败</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="info">信息</Badge>
<Badge variant="default">默认</Badge>
```

**Props:**
- `variant`: `'success' | 'error' | 'warning' | 'info' | 'default'` - 标签变体

### Alert（提示）

用于显示重要信息的提示组件。

```tsx
import { Alert } from '@/components/ui'

// 成功提示
<Alert variant="success" title="操作成功">
  您的操作已成功完成
</Alert>

// 错误提示
<Alert variant="error" title="操作失败">
  发生错误，请稍后重试
</Alert>

// 警告提示
<Alert variant="warning">
  请注意：此操作不可撤销
</Alert>

// 信息提示
<Alert variant="info">
  这是一条重要信息
</Alert>
```

**Props:**
- `variant`: `'success' | 'error' | 'warning' | 'info'` - 提示类型
- `title`: `string` - 标题（可选）

### Progress（进度条）

显示任务进度的组件。

```tsx
import { Progress } from '@/components/ui'

// 基础进度条
<Progress value={50} max={100} />

// 显示百分比标签
<Progress value={75} showLabel />

// 不同尺寸
<Progress value={60} size="sm" />
<Progress value={60} size="md" />
<Progress value={60} size="lg" />

// 不同颜色
<Progress value={80} variant="success" />
<Progress value={50} variant="warning" />
<Progress value={30} variant="error" />
```

**Props:**
- `value`: `number` - 当前值
- `max`: `number` - 最大值（默认 100）
- `showLabel`: `boolean` - 是否显示百分比标签
- `size`: `'sm' | 'md' | 'lg'` - 进度条尺寸
- `variant`: `'default' | 'success' | 'warning' | 'error'` - 进度条颜色

## 工具函数

### cn()

用于合并 Tailwind CSS 类名的工具函数。

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  anotherCondition ? 'class-a' : 'class-b'
)}>
  内容
</div>
```

## 设计规范

所有组件都遵循以下设计规范：

1. **颜色方案**：使用 Indigo 作为主色调
2. **圆角**：统一使用 `rounded-lg` (8px)
3. **间距**：使用 Tailwind 的间距系统
4. **深色模式**：所有组件都支持深色模式
5. **可访问性**：遵循 WCAG 2.1 AA 标准
6. **响应式**：适配各种屏幕尺寸

## 最佳实践

1. **统一导入**：使用 `@/components/ui` 统一导入所有组件
2. **类型安全**：所有组件都提供 TypeScript 类型定义
3. **组合使用**：组件可以灵活组合使用
4. **自定义样式**：通过 `className` prop 可以添加自定义样式
5. **可访问性**：确保所有交互元素都有适当的 ARIA 属性

## 示例：完整表单

```tsx
import { Card, CardHeader, CardTitle, CardContent, Input, Textarea, Button } from '@/components/ui'

export function VideoForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>创建视频任务</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input
            label="提示词"
            placeholder="例如：A cute cat playing on the grass"
            required
          />
          <Textarea
            label="详细描述"
            rows={4}
            helperText="请详细描述您想要生成的视频内容"
          />
          <div className="flex gap-4">
            <Button variant="primary" type="submit">
              提交
            </Button>
            <Button variant="secondary" type="button">
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

## 更新日志

- 2024-01-XX: 初始版本，包含基础 UI 组件

