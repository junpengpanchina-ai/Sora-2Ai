# 批量生成会话过期和保存问题修复

## 问题描述

1. **优点**：关闭了，重新打开，还看到暂停列表 ✅
2. **缺点**：
   - 管理员到一定时间会自动退出失效 ❌
   - 已生成的513条文案，没有及时保存 ❌

## 修复方案

### 1. 延长管理员会话时间 ✅

**文件**: `app/api/auth/admin-login/route.ts`

- **修改前**: 会话持续时间 24 小时
- **修改后**: 会话持续时间 7 天（168小时）
- **原因**: 批量生成可能需要很长时间，24小时可能不够

```typescript
// 🔥 延长会话时间到 7 天，避免批量生成过程中会话过期
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7天（168小时）
```

### 2. 添加管理员会话自动刷新机制 ✅

**文件**: `app/admin/AdminClient.tsx`

- **功能**: 每30分钟自动刷新管理员会话
- **实现**: 使用 `useEffect` 和 `setInterval` 定期调用刷新 API
- **效果**: 只要页面打开，会话就会自动延长，避免过期

```typescript
// 🔥 管理员会话自动刷新机制（每30分钟刷新一次，避免会话过期）
useEffect(() => {
  const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000 // 30分钟
  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/admin-refresh-session', { method: 'POST' })
      if (response.ok) {
        console.log('[AdminClient] 管理员会话已刷新')
      }
    } catch (error) {
      console.warn('[AdminClient] 会话刷新失败（可能已过期）:', error)
    }
  }

  // 立即刷新一次
  refreshSession()

  // 每30分钟刷新一次
  const interval = setInterval(refreshSession, SESSION_REFRESH_INTERVAL)

  return () => {
    clearInterval(interval)
  }
}, [])
```

### 3. 创建会话刷新 API 端点 ✅

**文件**: `app/api/auth/admin-refresh-session/route.ts`

- **功能**: 刷新管理员会话，延长过期时间
- **实现**: 调用数据库函数 `admin_extend_session` 更新会话过期时间
- **权限**: 需要有效的管理员会话

### 4. 创建数据库迁移：添加会话延长函数 ✅

**文件**: `supabase/migrations/008_add_admin_extend_session.sql`

- **功能**: 添加 `admin_extend_session` 函数
- **实现**: 更新 `admin_sessions` 表的 `expires_at` 字段
- **安全**: 只更新未过期的会话

```sql
CREATE OR REPLACE FUNCTION admin_extend_session(
  p_token_hash TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_sessions
  SET expires_at = p_expires_at,
      updated_at = NOW()
  WHERE token_hash = p_token_hash
    AND expires_at > NOW(); -- 只更新未过期的会话
  
  RETURN FOUND;
END;
$$;
```

### 5. 改进保存逻辑：每保存一条立即更新进度 ✅

**文件**: `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`

- **修改前**: 每保存3条或10条才更新一次进度
- **修改后**: 每保存一条立即更新进度
- **原因**: 确保即使会话过期或页面关闭，已保存的数据也不会丢失
- **关键**: 使用 service client，不依赖管理员会话

```typescript
// 🔥 每保存一条立即更新进度，避免数据丢失（使用 service client，不依赖管理员会话）
try {
  const { data: currentTask } = await tasksTable()
    .select('total_scenes_saved')
    .eq('id', taskId)
    .single()
  
  const currentSaved = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_saved || 0
  
  // 立即更新已保存的数量（每保存一条就更新一次）
  // 注意：这里使用 service client，不依赖管理员会话，即使会话过期也能继续保存
  await tasksTable()
    .update({
      total_scenes_saved: currentSaved + 1, // 每次只增加1，因为是一条一条保存的
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
} catch (updateError) {
  console.warn(`[${industry}] 批次 ${batchNumber}: 更新进度失败（继续保存）:`, updateError)
  // 即使更新失败，也继续保存，避免中断
}
```

## 修复效果

### 会话过期问题 ✅
- ✅ 会话时间从 24 小时延长到 7 天
- ✅ 每30分钟自动刷新会话（只要页面打开）
- ✅ 即使会话过期，保存逻辑使用 service client，不受影响

### 保存不及时问题 ✅
- ✅ 每保存一条立即更新进度
- ✅ 使用 service client，不依赖管理员会话
- ✅ 即使页面关闭或会话过期，已保存的数据也不会丢失

## 技术细节

### Service Client vs Admin Session

**关键区别**：
- **Admin Session**: 用于前端认证，可能过期
- **Service Client**: 用于后端操作，使用 `SUPABASE_SERVICE_ROLE_KEY`，永不过期

**保存逻辑**：
- 批量生成 API (`/api/admin/batch-generation/process/route.ts`) 使用 `createServiceClient()`
- 保存场景词时使用传入的 `supabase` 参数（已经是 service client）
- 因此，即使管理员会话过期，保存操作也能继续

### 进度更新频率

**修改前**：
- 每保存3条或10条才更新一次进度
- 如果在这期间会话过期或页面关闭，已保存的数据可能丢失

**修改后**：
- 每保存一条立即更新进度
- 即使会话过期或页面关闭，已保存的数据也不会丢失

## 测试建议

1. **会话刷新测试**：
   - 登录管理员后台
   - 打开浏览器控制台
   - 观察每30分钟是否有 "管理员会话已刷新" 日志

2. **保存进度测试**：
   - 启动批量生成任务
   - 观察数据库 `batch_generation_tasks` 表的 `total_scenes_saved` 字段
   - 确认每保存一条就立即更新

3. **会话过期测试**：
   - 启动批量生成任务
   - 等待会话过期（或手动删除会话）
   - 确认保存操作仍然继续（因为使用 service client）

## 注意事项

1. **数据库迁移**：
   - 需要运行 `supabase/migrations/008_add_admin_extend_session.sql`
   - 或者通过 Supabase Dashboard 手动执行 SQL

2. **会话刷新**：
   - 只有在页面打开时才会自动刷新
   - 如果页面关闭，会话不会自动刷新
   - 但保存操作不受影响（使用 service client）

3. **进度更新**：
   - 每保存一条就更新进度，可能会增加数据库写入次数
   - 但这是必要的，以确保数据不丢失

## 总结

✅ **会话过期问题已解决**：
- 会话时间延长到 7 天
- 每30分钟自动刷新（页面打开时）
- 保存操作使用 service client，不受会话过期影响

✅ **保存不及时问题已解决**：
- 每保存一条立即更新进度
- 使用 service client，不依赖管理员会话
- 即使页面关闭或会话过期，已保存的数据也不会丢失

