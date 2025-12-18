# 批量生成 500 错误诊断指南

## 🔍 已增强的错误日志

我已经为批量生成功能添加了详细的错误日志，现在可以更准确地定位问题。

## 📋 错误日志位置

### 1. 浏览器控制台（前端错误）

打开浏览器开发者工具（F12），查看 **Console** 标签页，你会看到：

- `[任务 X] 生成失败:` - 内容生成阶段的错误
- `[任务 X] 保存失败:` - 数据库保存阶段的错误
- `Chat API 响应:` - API 调用的详细响应
- `保存响应:` - 数据库保存的详细响应

### 2. 服务器日志（后端错误）

查看终端或服务器日志，你会看到：

- `[use-cases POST] Supabase 插入错误:` - 数据库插入错误详情
- `[Grsai Chat API] 请求失败:` - Chat API 调用失败详情
- `创建使用场景失败:` - 完整的错误堆栈

## 🛠️ 常见错误及解决方案

### 错误 1: API Key 未配置或无效

**症状：**
- 错误信息包含 `401` 或 `未授权`
- 控制台显示 `GRSAI_API_KEY 环境变量未配置`

**解决方案：**
1. 检查 `.env.local` 文件是否存在
2. 确认 `GRSAI_API_KEY` 已正确设置
3. 重启开发服务器：`npm run dev`

### 错误 2: 数据库连接失败

**症状：**
- 错误信息包含 `Supabase` 或 `数据库`
- 状态码 `500`，错误详情包含 `connection` 或 `timeout`

**解决方案：**
1. 检查 `.env.local` 中的 Supabase 配置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. 确认 Supabase 项目状态正常
3. 检查网络连接

### 错误 3: 数据库表不存在

**症状：**
- 错误信息包含 `relation "use_cases" does not exist`
- 错误代码 `42P01`

**解决方案：**
1. 执行数据库迁移：
   ```bash
   supabase db push
   ```
2. 或在 Supabase Dashboard 的 SQL Editor 中执行：
   - `supabase/migrations/034_create_use_cases_table.sql`

### 错误 4: 字段验证失败

**症状：**
- 错误信息包含 `Slug 不能为空` 或 `H1 不能为空`
- 错误信息包含 `使用场景类型不合法`

**解决方案：**
1. 检查生成的内容是否包含 H1 标题
2. 确认 `use_case_type` 是有效的类型（见下方列表）
3. 检查关键词是否为空

### 错误 5: API 请求频率过高

**症状：**
- 错误信息包含 `429` 或 `请求频率过高`

**解决方案：**
1. 减少批量生成的数量（每次生成 5-10 个）
2. 增加请求间隔时间
3. 稍后重试

### 错误 6: API 服务不可用

**症状：**
- 错误信息包含 `500`、`502` 或 `503`
- 错误信息包含 `API 服务暂时不可用`

**解决方案：**
1. 检查 GRSAI API 服务状态
2. 稍后重试
3. 检查网络连接

## 🔧 诊断步骤

### 步骤 1: 检查环境变量

```bash
# 检查 .env.local 文件
cat .env.local | grep GRSAI
cat .env.local | grep SUPABASE
```

### 步骤 2: 测试 API 连接

访问 `/admin/debug` 页面，检查：
- 数据库连接状态
- API 配置状态

### 步骤 3: 查看详细错误

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 点击"开始批量生成"
4. 查看控制台输出的详细错误信息

### 步骤 4: 检查服务器日志

如果使用 `npm run dev`，查看终端输出：
- 查找 `[use-cases POST]` 开头的日志
- 查找 `[Grsai Chat API]` 开头的日志

## 📊 有效的使用场景类型

确保 `use_case_type` 是以下值之一：

- `marketing` - 营销推广
- `education` - 教育培训
- `entertainment` - 娱乐内容
- `product` - 产品展示
- `social_media` - 社交媒体
- `corporate` - 企业宣传
- `creative` - 创意艺术
- `tutorial` - 教程指南

## 🚀 快速测试

### 测试单个生成

1. 选择一个关键词
2. 设置数量为 `1`
3. 点击"开始批量生成"
4. 查看控制台输出

### 测试 API 连接

在浏览器控制台运行：

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    stream: false,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ]
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### 测试数据库连接

在浏览器控制台运行：

```javascript
fetch('/api/admin/use-cases', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## 📝 报告错误

如果问题仍然存在，请提供以下信息：

1. **浏览器控制台错误**（截图或复制文本）
2. **服务器日志错误**（终端输出）
3. **操作步骤**（你做了什么操作）
4. **环境信息**：
   - Node.js 版本
   - Next.js 版本
   - 是否在生产环境

## ✅ 已修复的问题

- ✅ 增强了 Chat API 错误处理
- ✅ 增强了数据库保存错误处理
- ✅ 添加了详细的错误日志
- ✅ 改进了错误信息显示
- ✅ 添加了错误堆栈跟踪

