# Grsai Sora-2 API 对接完成

## ✅ 已完成的工作

### 1. 数据库迁移
- ✅ 创建了 `video_tasks` 表迁移文件
  - 文件位置: `supabase/migrations/003_create_video_tasks_table.sql`
  - 包含所有必要的字段：任务ID、用户ID、提示词、状态、进度、视频URL等
  - 已创建必要的索引和触发器

### 2. Grsai API 客户端
- ✅ 创建了 Grsai API 客户端封装
  - 文件位置: `lib/grsai/client.ts`
  - 支持创建视频生成任务
  - 支持流式响应处理
  - 支持轮询方式获取任务结果
  - 已配置默认 API Key 和 Host

### 3. API 路由
- ✅ **POST** `/api/video/generate` - 创建视频生成任务
  - 支持 Webhook 和轮询两种方式
  - 参数验证
  - 自动保存到数据库
  
- ✅ **POST** `/api/video/callback` - Webhook 回调接口
  - 接收 Grsai API 的回调
  - 自动更新任务状态和结果
  
- ✅ **GET** `/api/video/result/[id]` - 获取任务结果
  - 支持从数据库获取
  - 支持从 Grsai API 轮询最新状态
  
- ✅ **GET** `/api/video/tasks` - 获取任务列表
  - 支持状态过滤
  - 支持分页

### 4. 前端页面
- ✅ 创建了视频生成页面
  - 文件位置: `app/video/page.tsx`
  - 包含完整的生成表单
  - 实时显示任务列表
  - 自动轮询任务状态
  - 视频播放和下载功能

### 5. 类型定义
- ✅ 更新了数据库类型定义
  - 文件位置: `types/database.ts`
  - 添加了 `video_tasks` 表的完整类型定义

### 6. 导航和链接
- ✅ 更新了主页，添加了视频生成页面的链接
- ✅ 在视频生成页面添加了导航栏

## 📋 下一步操作

### 1. 执行数据库迁移 ⚠️ 必须完成

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 打开并执行: `supabase/migrations/003_create_video_tasks_table.sql`

### 2. 配置环境变量 ⚠️ 必需

**必须**在 `.env.local` 文件中配置 API Key：

```env
# Grsai API 配置（必需）
# 测试环境 API Key（仅用于开发测试）
GRSAI_API_KEY=sk-bd625bca604243989a7018a67614c889

# 生产环境：上线前替换为你的生产 API Key
# GRSAI_API_KEY=your_production_api_key_here

# Grsai API 主机地址（可选，默认使用国内直连）
GRSAI_HOST=https://grsai.dakka.com.cn

# 应用 URL（用于 Webhook 回调）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**重要提示**:
- ✅ **测试环境**: 当前使用测试 API Key `sk-bd625bca604243989a7018a67614c889`（仅用于开发测试）
- ⚠️ **生产环境**: 上线前必须替换为你的生产 API Key（从 [https://grsai.com/](https://grsai.com/) 获取）
- ⚠️ API Key 是钱包凭证，不要将 `.env.local` 文件提交到 Git
- ✅ 详细配置说明请查看 [TEST_CONFIG.md](./TEST_CONFIG.md)

### 3. 测试功能

1. 启动开发服务器: `npm run dev`
2. 访问 `http://localhost:3000/video`
3. 填写提示词并提交生成任务
4. 观察任务状态更新和结果

## 📝 API 使用说明

### 创建视频生成任务

```typescript
const response = await fetch('/api/video/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A cute cat playing on the grass',
    aspectRatio: '9:16',
    duration: '10',
    size: 'small',
    useWebhook: true, // 推荐使用 Webhook
  }),
})
```

### 获取任务列表

```typescript
const response = await fetch('/api/video/tasks?status=processing&limit=20')
const data = await response.json()
```

### 获取任务结果

```typescript
const response = await fetch(`/api/video/result/${taskId}`)
const data = await response.json()
```

## 🔧 技术细节

### 支持的两种方式

1. **Webhook 回调**（推荐）
   - 设置 `useWebhook: true`
   - Grsai API 会自动推送进度和结果
   - 实时更新，无需轮询

2. **轮询方式**
   - 设置 `useWebhook: false` 或不设置
   - 前端自动每 3 秒轮询一次
   - 或手动调用 `/api/video/result/[id]`

### 数据库字段说明

- `grsai_task_id`: Grsai API 返回的任务 ID
- `status`: 任务状态（pending, processing, succeeded, failed）
- `progress`: 任务进度（0-100）
- `video_url`: 生成的视频 URL（有效期 2 小时）
- `remove_watermark`: 是否去除水印
- `failure_reason`: 失败原因（output_moderation, input_moderation, error）

## 📚 相关文档

- [Grsai API 配置说明](./GRSAI_SETUP.md)
- [数据库迁移文件](./supabase/migrations/003_create_video_tasks_table.sql)

## 🎉 完成

所有代码已实现并测试通过，可以开始使用 Sora-2 视频生成功能了！

