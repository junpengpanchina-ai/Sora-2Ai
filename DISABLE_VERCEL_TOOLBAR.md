# 禁用 Vercel Toolbar 指南

## 问题说明

Vercel Toolbar（包含 "Layout Shifts" 和 "Vercel Toolbar" 按钮）不应该出现在面向消费者的生产网站上。

## 解决方案

### 方法 1：在 Vercel Dashboard 中禁用（推荐）

#### 在项目级别禁用：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** 标签页
4. 在 **General** 部分，找到 **Vercel Toolbar** 设置
5. 对于 **Production** 环境，选择 **Off**
6. 保存设置
7. 重新部署应用

#### 在团队级别禁用：

1. 在 Vercel Dashboard 中选择你的团队
2. 进入 **Settings** 标签页
3. 在 **General** 部分，找到 **Vercel Toolbar** 设置
4. 对于 **Production** 环境，选择 **Off**
5. （可选）允许在项目级别覆盖此设置

### 方法 2：通过环境变量禁用

在 Vercel 项目设置中添加环境变量：

- **Name**: `NEXT_PUBLIC_VERCEL_ENV`
- **Value**: `production`（仅在生产环境）
- **Environment**: Production

### 方法 3：代码层面禁用（如果 Toolbar 是通过包注入的）

如果 Toolbar 是通过某个包自动注入的，可以在 `next.config.js` 中添加配置。

## 验证

禁用后：

1. 重新部署应用
2. 清除浏览器缓存
3. 访问生产网站
4. 确认不再看到 Vercel Toolbar 按钮

## 注意事项

- Vercel Toolbar 在开发环境（localhost）中可能仍然显示，这是正常的
- 预览环境（Preview）可以单独配置是否显示
- 生产环境（Production）必须禁用，避免用户看到

## 相关链接

- [Vercel Toolbar 管理文档](https://vercel.com/docs/vercel-toolbar/managing-toolbar)
