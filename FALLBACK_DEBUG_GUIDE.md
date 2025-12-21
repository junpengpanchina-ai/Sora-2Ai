# Fallback 机制调试指南

## 🔍 问题：已生成 0 条场景词

如果看到"已生成 0 条场景词，正在保存..."，说明 `generateIndustryScenes` 返回了空数组。

## 🔧 已实现的强制 Fallback 机制

### 1. 空数组检测（最高优先级）

在 `generate-scenes.ts` 中，系统会在以下位置强制检查空数组：

```typescript
// 位置 1: 2.5-flash 生成后立即检查
if (scenes.length === 0) {
  needsFallback = true
  console.warn(`⚠️ gemini-2.5-flash 返回空数组，强制切换到 gemini-3-flash（联网搜索）`)
}

// 位置 2: Level 2 fallback 条件检查
if ((needsFallback && !needsPro) || (scenes.length === 0 && !needsPro)) {
  // 强制切换到 3-flash
}

// 位置 3: 3-flash 生成后也检查
if (scenes.length === 0) {
  console.error(`⚠️ gemini-3-flash 也返回空数组，将切换到 gemini-3-pro（最高质量）`)
  needsPro = true
}
```

### 2. 错误处理

如果生成失败，会清空 `scenes` 数组，确保触发 fallback：

```typescript
catch (error) {
  needsFallback = true
  scenes = [] // 清空数组，确保触发 fallback
}
```

## 🐛 调试步骤

### 步骤 1: 查看 Vercel 日志

在 Vercel Dashboard → 你的项目 → Logs，搜索以下关键词：

1. **检查是否调用了 API**
   ```
   [Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
   ```

2. **检查是否收到响应**
   ```
   [Real Estate] 批次 1: 收到内容长度 15234 字符
   ```

3. **检查 JSON 解析**
   ```
   [Real Estate] 批次 1: 成功解析 JSON，获得 50 条场景词
   ```

4. **检查是否触发 fallback**
   ```
   [Real Estate] 批次 1: ⚠️ gemini-2.5-flash 返回空数组，强制切换到 gemini-3-flash（联网搜索）
   ```

### 步骤 2: 检查 API 响应

如果看到"收到内容长度 X 字符"，但解析后是空数组，可能是：

1. **JSON 格式错误**
   - 查看日志中的 "JSON 内容预览"
   - 检查是否有语法错误

2. **内容被过滤掉**
   - 检查 "过滤掉 X 条无效场景词"
   - 可能是所有内容都太短（< 50 字符）

### 步骤 3: 检查 Fallback 是否触发

如果看到以下日志，说明 fallback 已触发：

```
[Real Estate] 批次 1: 🔄 强制切换到 gemini-3-flash（联网搜索）...
[Real Estate] 批次 1: 切换原因: 空数组
[Real Estate] 批次 1: gemini-3-flash 收到内容长度 X 字符
```

如果**没有**看到这些日志，说明 fallback 没有触发，可能是：

1. **代码逻辑问题**：检查 `needsFallback` 和 `scenes.length === 0` 的条件
2. **异常被捕获但没有设置 fallback**：检查 catch 块

## 🔥 强制 Fallback 保障

系统在以下位置强制检查：

1. ✅ **2.5-flash 生成后**：立即检查空数组
2. ✅ **Level 2 条件**：`if ((needsFallback && !needsPro) || (scenes.length === 0 && !needsPro))`
3. ✅ **3-flash 生成后**：如果也返回空数组，切换到 3-pro
4. ✅ **错误捕获**：生成失败时清空 `scenes` 数组

## 📊 预期日志流程

### 正常流程（2.5-flash 成功）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: 收到内容长度 15234 字符
[Real Estate] 批次 1: 成功解析 JSON，获得 50 条场景词
[Real Estate] 批次 1: ✅ gemini-2.5-flash 生成成功，添加 50 条场景词
```

### Fallback 流程（2.5-flash 失败 → 3-flash）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: 收到内容长度 0 字符  // 或解析后 scenes.length === 0
[Real Estate] 批次 1: ⚠️ gemini-2.5-flash 返回空数组，强制切换到 gemini-3-flash（联网搜索）
[Real Estate] 批次 1: 🔄 强制切换到 gemini-3-flash（联网搜索）...
[Real Estate] 批次 1: gemini-3-flash 收到内容长度 18456 字符
[Real Estate] 批次 1: ✅ gemini-3-flash 生成成功，添加 50 条场景词
```

### 极端情况（所有模型都失败）
```
[Real Estate] 批次 1: 使用 gemini-2.5-flash 生成...
[Real Estate] 批次 1: ❌ gemini-2.5-flash 生成失败
[Real Estate] 批次 1: 🔄 强制切换到 gemini-3-flash（联网搜索）...
[Real Estate] 批次 1: ❌ gemini-3-flash 失败，强制切换到 gemini-3-pro...
[Real Estate] 批次 1: ✅ gemini-3-pro 生成成功，添加 50 条场景词
```

## ⚠️ 如果仍然返回 0 条场景词

如果系统已经切换到 3-flash 或 3-pro，但仍然返回 0 条，可能是：

1. **API 调用失败**：检查网络连接和 API Key
2. **JSON 解析失败**：检查 API 返回的内容格式
3. **内容全部被过滤**：检查过滤条件（长度 < 50 字符）

**建议：** 查看 Vercel 日志中的详细错误信息，特别是：
- API 调用的响应内容
- JSON 解析的错误信息
- 过滤掉的场景词数量

