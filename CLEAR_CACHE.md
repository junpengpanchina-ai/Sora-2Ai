# 清除缓存指南

## 问题描述

数据库中的 `page_slug` 已经正确（不包含 `.xml` 后缀），但这两个关键词页面还是显示 XML 代码而不是 HTML 页面：
- `keywords-romania-buy-sora2-credits`
- `keywords-romania-sora2-vs-runway`

这很可能是 **Vercel CDN 缓存** 或 **Next.js 静态生成缓存** 的问题。

## 解决方案

### 方案 1: 在 Vercel 中清除缓存（推荐）

1. **访问 Vercel Dashboard**
   - 打开：https://vercel.com/dashboard
   - 登录并选择项目

2. **清除部署缓存**
   - 进入项目设置
   - 找到 **Deployments** 页面
   - 点击最新的部署
   - 点击 **Redeploy** 按钮
   - 选择 **"Use existing Build Cache"** 的选项，取消勾选
   - 点击 **Redeploy**

3. **或者清除特定路径的缓存**
   - 在 Vercel Dashboard 中，进入项目设置
   - 找到 **Edge Network** 或 **Caching** 设置
   - 清除以下路径的缓存：
     - `/keywords/keywords-romania-buy-sora2-credits`
     - `/keywords/keywords-romania-sora2-vs-runway`

### 方案 2: 通过 API 清除 Vercel 缓存

如果你有 Vercel API Token，可以使用以下命令：

```bash
# 清除特定路径的缓存
curl -X POST "https://api.vercel.com/v1/edge-config/{configId}/items" \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "operation": "delete",
        "key": "/keywords/keywords-romania-buy-sora2-credits"
      },
      {
        "operation": "delete",
        "key": "/keywords/keywords-romania-sora2-vs-runway"
      }
    ]
  }'
```

### 方案 3: 重新部署（最简单）

1. **触发新的部署**
   - 在 GitHub 中创建一个空的 commit：
     ```bash
     git commit --allow-empty -m "chore: trigger redeploy to clear cache"
     git push
     ```
   - 这会触发 Vercel 重新部署，清除旧的缓存

### 方案 4: 在代码中强制重新验证

已经在代码中添加了：
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

这应该能确保每次请求都获取最新数据，但如果 Vercel CDN 已经缓存了响应，仍然需要清除缓存。

## 验证步骤

清除缓存后：

1. **使用无痕模式访问**
   - 打开浏览器的无痕/隐私模式
   - 访问：`https://sora2aivideos.com/keywords/keywords-romania-buy-sora2-credits`
   - 应该看到 HTML 页面，而不是 XML 代码

2. **检查响应头**
   - 打开浏览器开发者工具（F12）
   - 进入 Network 标签
   - 刷新页面
   - 检查响应头中的 `Content-Type`
   - 应该是 `text/html; charset=utf-8`，而不是 `application/xml`

3. **检查页面内容**
   - 页面应该显示完整的 HTML 介绍页面
   - 包含 Overview、Steps、FAQ 等部分
   - 而不是 XML 源代码

## 临时解决方案

如果无法立即清除 Vercel 缓存，可以：

1. **添加查询参数强制刷新**
   - 访问：`https://sora2aivideos.com/keywords/keywords-romania-buy-sora2-credits?v=1`
   - 这会绕过某些缓存

2. **等待缓存过期**
   - Vercel 的 CDN 缓存通常会在 24 小时内过期
   - 但建议主动清除缓存

## 预防措施

为了避免将来出现类似问题：

1. **确保代码中设置了正确的缓存控制**
   ```typescript
   export const dynamic = 'force-dynamic'
   export const revalidate = 0
   ```

2. **在 Vercel 中配置缓存策略**
   - 对于动态路由，应该禁用缓存或设置较短的缓存时间

3. **使用版本号或时间戳**
   - 在 URL 中添加版本参数，强制刷新缓存

