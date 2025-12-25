# 聊天功能调试指南

## 🔍 快速诊断

### 在浏览器 Console 中运行

```javascript
// 1. 运行完整诊断（推荐先运行这个）
async function runDiagnostics() {
  try {
    const res = await fetch('/api/admin/chat/debug');
    const data = await res.json();
    console.log('诊断结果:', data);
    return data;
  } catch (error) {
    console.error('诊断失败:', error);
    return { success: false, error: error.message };
  }
}

// 2. 检查会话列表
async function checkSessions() {
  try {
    const res = await fetch('/api/admin/chat/sessions');
    const data = await res.json();
    console.log('会话列表:', data);
    return data;
  } catch (error) {
    console.error('检查会话失败:', error);
    return { success: false, error: error.message };
  }
}

// 3. 测试发送消息
async function testSendMessage(sessionId = null) {
  try {
    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        message: '测试消息',
        stream: false,
        saveHistory: true,
      }),
    });
    const data = await res.json();
    console.log('发送消息结果:', data);
    return data;
  } catch (error) {
    console.error('发送消息失败:', error);
    return { success: false, error: error.message };
  }
}

// 4. 运行完整测试
async function runTest() {
  try {
    const res = await fetch('/api/admin/chat/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testMessage: '测试消息' }),
    });
    const data = await res.json();
    console.log('测试结果:', data);
    return data;
  } catch (error) {
    console.error('测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 使用示例：
// await runDiagnostics();  // 先运行诊断
// await checkSessions();   // 检查会话
// await testSendMessage();  // 测试发送消息
// await runTest();          // 运行完整测试
```

## 🐛 常见错误及解决方案

### 1. 404 Not Found - `/api/admin/chat/debug`

**原因：** 路由文件未正确部署或路径不对

**解决方案：**
- 检查文件是否存在：`app/api/admin/chat/debug/route.ts`
- 重新部署项目
- 检查 Next.js 路由配置

### 2. 500 Internal Server Error - 数据库查询失败

**可能原因：**
- 数据库表不存在（迁移文件未运行）
- RLS 策略问题
- 数据库连接问题

**解决方案：**
```sql
-- 在 Supabase SQL Editor 中运行
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_chat_sessions', 'admin_chat_messages');

-- 如果表不存在，运行迁移文件
-- 文件路径：supabase/migrations/041_create_admin_chat_history.sql
```

### 3. API 返回空 choices 数组

**可能原因：**
- GRSAI_API_KEY 未配置或错误
- API 请求格式不正确
- API 服务暂时不可用
- 请求内容被过滤

**解决方案：**
1. 检查环境变量：
   ```bash
   # 在 Vercel 或本地 .env.local 中检查
   GRSAI_API_KEY=your-api-key-here
   ```

2. 检查 API 响应：
   ```javascript
   // 在 Console 中运行
   async function testApiDirectly() {
     const response = await fetch('/api/admin/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         message: 'Hello',
         stream: false,
       }),
     });
     const data = await response.json();
     console.log('API 响应:', data);
     if (data.debug) {
       console.log('调试信息:', data.debug);
     }
   }
   ```

### 4. 405 Method Not Allowed

**原因：** 路由文件存在但未导出对应的 HTTP 方法

**解决方案：**
- 检查 `app/api/admin/chat/debug/route.ts` 是否导出了 `POST` 函数
- 确保文件已保存并重新部署

## 📋 诊断检查清单

运行 `runDiagnostics()` 后，检查以下项目：

- [ ] **认证** ✅ - 管理员已登录
- [ ] **数据库 - 会话表** ✅ - 表存在且可访问
- [ ] **数据库 - 消息表** ✅ - 表存在且可访问
- [ ] **Gemini API Key** ✅ - 已配置
- [ ] **Gemini API 连接** ✅ - 可以连接到 API
- [ ] **环境变量** ✅ - 所有必需变量已设置

## 🔧 手动检查步骤

### 1. 检查数据库表

在 Supabase Dashboard 的 SQL Editor 中运行：

```sql
-- 检查表是否存在
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('admin_chat_sessions', 'admin_chat_messages')
ORDER BY table_name, ordinal_position;
```

### 2. 检查环境变量

在 Vercel Dashboard 或本地 `.env.local` 中检查：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GRSAI_API_KEY=...
```

### 3. 检查 API 连接

```javascript
// 测试 Gemini API 连接
async function testGeminiConnection() {
  const apiKey = 'your-api-key'; // 从环境变量获取
  const response = await fetch('https://api.grsai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  console.log('API 连接测试:', {
    status: response.status,
    ok: response.ok,
    data: await response.json(),
  });
}
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. `runDiagnostics()` 的完整输出
2. 浏览器 Console 中的错误信息
3. 服务器日志（Vercel Logs）
4. 数据库表是否存在（运行上面的 SQL 查询）

