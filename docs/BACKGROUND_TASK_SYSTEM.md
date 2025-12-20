# 后台任务系统实现说明

## 需求
用户希望批量生成场景词的任务能够在后台持续运行，即使关闭页面也不会中断。

## 实现方案

### 1. 数据库表
已创建 `batch_generation_tasks` 表来存储任务状态。

### 2. API 端点

#### POST `/api/admin/batch-generation/start`
- 创建后台任务
- 立即返回任务 ID
- 任务在服务器端异步执行

#### GET `/api/admin/batch-generation/status/[taskId]`
- 查询任务状态和进度

#### POST `/api/admin/batch-generation/control`
- 控制任务：暂停/恢复/取消

### 3. 前端修改
前端需要：
1. 调用 `/api/admin/batch-generation/start` 启动任务
2. 定期轮询 `/api/admin/batch-generation/status/[taskId]` 获取进度
3. 使用 `localStorage` 保存任务 ID，页面刷新后可以恢复监控

### 4. 注意事项

#### Next.js API 路由执行时间限制
- Vercel 免费版：10 秒
- Vercel 付费版：60 秒
- 对于长时间运行的任务，需要将任务分解成小批次

#### 解决方案
1. **方案 A（推荐）**：使用 Vercel Cron Jobs
   - 创建 `vercel.json` 配置定时任务
   - 每分钟处理一个待处理的行业
   - 任务状态存储在数据库中

2. **方案 B**：使用 Supabase Edge Functions
   - 创建 Edge Function 处理任务
   - 无执行时间限制

3. **方案 C**：任务分解
   - API 路由每次处理一个行业
   - 前端定期调用 API 继续处理下一个行业
   - 需要前端保持连接（不满足需求）

## 推荐实现：Vercel Cron Jobs

### 1. 创建 `vercel.json`
```json
{
  "crons": [{
    "path": "/api/admin/batch-generation/process",
    "schedule": "*/1 * * * *"
  }]
}
```

### 2. 创建处理 API
`/api/admin/batch-generation/process/route.ts`
- 每分钟执行一次
- 查找 `status = 'processing'` 的任务
- 处理下一个待处理的行业
- 更新任务状态

### 3. 前端修改
- 调用 `/api/admin/batch-generation/start` 创建任务
- 定期轮询任务状态
- 即使关闭页面，Cron Job 也会继续处理

## 当前实现状态

✅ 已完成：
- 数据库表结构
- API 端点框架
- 前端调用逻辑（部分）

⚠️ 待完成：
- 完善 `processBatchGenerationTask` 函数
- 实现 Vercel Cron Job 或 Supabase Edge Function
- 测试后台任务执行

## 下一步

1. 执行数据库迁移：`supabase/migrations/038_create_batch_generation_tasks.sql`
2. 完善 `app/api/admin/batch-generation/start/route.ts` 中的任务处理逻辑
3. 创建 Vercel Cron Job 配置
4. 测试后台任务功能

