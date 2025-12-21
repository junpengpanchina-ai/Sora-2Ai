# API 响应调试指南 - 避免浪费积分

## 🔍 问题：API 调用成功但返回 0 条场景词

如果看到"已生成 0 条场景词"，但 GRSAI 那边扣了积分，说明：

1. ✅ API 调用成功（否则不会扣积分）
2. ❌ 但返回的内容解析后是空数组
3. 💸 **积分被浪费了**

## 🔧 已实现的防护机制

### 1. API 响应验证（在 `lib/grsai/client.ts`）

在返回响应前，系统会检查：

```typescript
// 检查 choices 数组
if (!data.choices || data.choices.length === 0) {
  throw new Error('API 返回空 choices 数组')
}

// 检查 content
if (!data.choices[0]?.message?.content) {
  throw new Error('API 返回空 content')
}
```

**如果 API 返回空内容，会立即抛出错误，不会继续处理，避免浪费积分。**

### 2. 详细日志记录（在 `generate-scenes.ts`）

每次 API 调用后，系统会记录：

1. **API 响应结构**
   ```typescript
   {
     hasChoices: true/false,
     choicesLength: 0/1,
     firstChoice: {
       hasMessage: true/false,
       hasContent: true/false,
       contentLength: 0/1234,
       finishReason: "stop"/"length"/"content_filter"
     }
   }
   ```

2. **原始内容预览**（前 500 字符）
   ```typescript
   console.log('原始内容预览（前500字符）:', rawContent.substring(0, 500))
   ```

3. **JSON 解析过程**
   ```typescript
   console.log('JSON 解析成功，原始场景词数量: X 条')
   ```

4. **过滤过程**
   ```typescript
   console.warn('过滤掉 X 条无效场景词（原始: Y 条，有效: Z 条）')
   ```

### 3. 空数组检测（强制 Fallback）

如果解析后是空数组，系统会：

1. **记录详细错误信息**
   ```typescript
   console.error('⚠️⚠️⚠️ 严重问题：返回空数组！')
   console.error('原始内容长度: X 字符')
   console.error('JSON 解析前数量: Y 条')
   console.error('过滤后数量: Z 条')
   ```

2. **自动切换到更高级模型**
   - `gemini-2.5-flash` → `gemini-3-flash`（联网搜索）
   - `gemini-3-flash` → `gemini-3-pro`（最高质量）

## 🐛 调试步骤

### 步骤 1: 查看 Vercel 日志

在 Vercel Dashboard → 你的项目 → Logs，搜索以下关键词：

1. **检查 API 响应结构**
   ```
   [Real Estate] 批次 1: API 响应结构:
   ```
   查看 `hasChoices`、`choicesLength`、`contentLength` 的值

2. **检查原始内容**
   ```
   [Real Estate] 批次 1: 原始内容预览（前500字符）:
   ```
   查看 API 实际返回了什么内容

3. **检查 JSON 解析**
   ```
   [Real Estate] 批次 1: JSON 解析成功，原始场景词数量: X 条
   ```
   如果这里是 0，说明 JSON 解析失败或返回了空数组

4. **检查过滤过程**
   ```
   [Real Estate] 批次 1: 过滤掉 X 条无效场景词（原始: Y 条，有效: Z 条）
   ```
   如果 `原始: Y 条` 是 0，说明 JSON 解析后就是空数组
   如果 `有效: Z 条` 是 0，说明所有场景词都被过滤掉了（长度 < 50 字符）

### 步骤 2: 分析问题原因

#### 情况 A: API 返回空 content

**日志特征：**
```
❌ API 返回空内容！完整响应: {...}
```

**可能原因：**
- API 内容被过滤（`finish_reason: "content_filter"`）
- API 返回错误但状态码是 200
- API 响应格式不正确

**解决方案：**
- 检查 `finish_reason` 字段
- 检查 API 响应的完整结构
- 联系 GRSAI 技术支持

#### 情况 B: JSON 解析失败

**日志特征：**
```
JSON 解析失败，尝试修复...
JSON 修复失败
```

**可能原因：**
- API 返回的不是 JSON 格式
- JSON 格式错误（缺少引号、括号等）
- API 返回了错误消息而不是 JSON

**解决方案：**
- 查看"原始内容预览"，检查实际返回的内容
- 可能需要调整 prompt，要求 AI 只返回 JSON

#### 情况 C: 所有内容被过滤

**日志特征：**
```
JSON 解析成功，原始场景词数量: 50 条
过滤掉 50 条无效场景词（原始: 50 条，有效: 0 条）
```

**可能原因：**
- 所有场景词的 `use_case` 长度 < 50 字符
- 场景词结构不正确（缺少 `use_case` 字段）

**解决方案：**
- 检查过滤条件（当前是 `s.use_case.trim().length > 50`）
- 可能需要降低过滤阈值（例如改为 30 字符）
- 检查 prompt，确保 AI 生成的内容符合要求

### 步骤 3: 检查积分消耗

如果看到"已生成 0 条场景词"，但积分被扣了，说明：

1. **API 调用成功**（否则不会扣积分）
2. **但返回的内容无效**

**建议：**
- 查看 Vercel 日志中的"API 响应结构"
- 如果 `contentLength` 是 0，说明 API 返回了空内容，应该联系 GRSAI 技术支持
- 如果 `contentLength` > 0，但解析后是空数组，说明是 JSON 解析或过滤问题

## 📊 预期日志流程

### 正常流程
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: API 响应结构: { hasChoices: true, choicesLength: 1, contentLength: 15234 }
[Real Estate] 批次 1: 收到内容长度 15234 字符
[Real Estate] 批次 1: 原始内容预览（前500字符）: [{"id":1,"use_case":"..."}]
[Real Estate] 批次 1: JSON 解析成功，原始场景词数量: 50 条
[Real Estate] 批次 1: ✅ gemini-2.5-flash 生成成功，添加 50 条场景词
```

### 问题流程（API 返回空内容）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: API 响应结构: { hasChoices: true, choicesLength: 1, contentLength: 0 }
[Real Estate] 批次 1: ❌ API 返回空内容！完整响应: {...}
[Real Estate] 批次 1: ❌ gemini-2.5-flash 生成失败: API 返回空内容
[Real Estate] 批次 1: 🔄 将强制切换到 gemini-3-flash（联网搜索）
```

### 问题流程（JSON 解析失败）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: API 响应结构: { hasChoices: true, choicesLength: 1, contentLength: 1234 }
[Real Estate] 批次 1: 收到内容长度 1234 字符
[Real Estate] 批次 1: 原始内容预览（前500字符）: Sorry, I cannot...
[Real Estate] 批次 1: JSON 解析失败，尝试修复...
[Real Estate] 批次 1: JSON 修复失败
[Real Estate] 批次 1: ❌ gemini-2.5-flash 生成失败: 无法解析 JSON
[Real Estate] 批次 1: 🔄 将强制切换到 gemini-3-flash（联网搜索）
```

### 问题流程（所有内容被过滤）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: JSON 解析成功，原始场景词数量: 50 条
[Real Estate] 批次 1: 过滤掉 50 条无效场景词（原始: 50 条，有效: 0 条）
[Real Estate] 批次 1: ⚠️⚠️⚠️ 严重问题：返回空数组！
[Real Estate] 批次 1: 将强制切换到 gemini-3-flash（联网搜索）
```

## ⚠️ 如果仍然返回 0 条场景词

如果系统已经切换到 3-flash 或 3-pro，但仍然返回 0 条，请：

1. **查看 Vercel 日志**，找到详细的错误信息
2. **检查 API 响应结构**，确认 `contentLength` 是否 > 0
3. **检查原始内容预览**，确认 API 返回了什么
4. **检查 JSON 解析过程**，确认是否有解析错误
5. **检查过滤过程**，确认是否有内容被过滤

**如果问题持续，建议：**
- 联系 GRSAI 技术支持，检查 API 返回的内容
- 调整 prompt，确保 AI 生成的内容符合要求
- 降低过滤阈值（例如从 50 字符改为 30 字符）

