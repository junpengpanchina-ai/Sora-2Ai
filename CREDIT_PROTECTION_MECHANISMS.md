# 🛡️ Gemini API 积分保护机制

## ✅ 确认：不会空烧调用 API

代码中实现了**多层保护机制**，确保不会浪费积分调用 Gemini API。

---

## 🔒 保护机制清单

### 1. **保存失败率检查** ⭐⭐⭐（最重要）

**位置**: `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`

**机制**:
- 每次保存一批场景词后，检查保存失败率
- 如果保存失败率 > 50%，**立即停止生成**（`break`）
- 避免继续调用 API 浪费积分

**代码**:
```typescript
// 🔥 检查保存失败率，如果超过 50%，停止避免浪费积分
const totalAttempted = saveResult.savedCount + saveResult.failedCount
const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0

if (saveFailureRate > 0.5) {
  console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，停止生成避免浪费积分`)
  allErrors.push(`批次 ${batch + 1} 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，已停止生成`)
  break // 停止整个循环，避免继续调用 API 浪费积分
}
```

**效果**:
- ✅ 如果保存失败率 > 50%，立即停止
- ✅ 不会继续调用下一个批次的 API
- ✅ 避免浪费积分

---

### 2. **任务停止检查** ⭐⭐⭐

**位置**: 
- `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`（每个批次前）
- `app/api/admin/batch-generation/process/save-scene.ts`（每次保存前）

**机制**:
- 在每个批次生成前检查 `should_stop` 和 `status === 'cancelled'`
- 如果任务已停止，**立即停止生成**（`break`）
- 不会继续调用 API

**代码**:
```typescript
// 🔥 检查是否应该停止（在每个批次前检查，避免浪费API调用）
const { data: checkTask } = await tasksTable()
  .select('should_stop, status')
  .eq('id', taskId)
  .single()

if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
  console.log(`[${industry}] 批次 ${batch + 1}: 任务已停止，停止生成`)
  break
}
```

**效果**:
- ✅ 如果用户点击停止，立即停止
- ✅ 不会继续调用下一个批次的 API
- ✅ 避免浪费积分

---

### 3. **内容被过滤时不重试** ⭐⭐

**位置**: `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`

**机制**:
- 如果内容被过滤（`content_filter`），**不应该重试**（会浪费积分）
- 跳过此批次，继续下一个批次

**代码**:
```typescript
// 🔥 使用错误分类决定是否重试
const errorClassification = classifyGenerationError(error)

// 如果内容被过滤，不应该重试（会浪费积分）
if (errorClassification.errorCategory === 'content_filter') {
  console.warn(`[${industry}] 批次 ${batch + 1}: ${errorClassification.errorMessage}，跳过此批次`)
  allErrors.push(`批次 ${batch + 1}: ${errorClassification.errorMessage}`)
  continue // 跳过此批次，继续下一个
}
```

**效果**:
- ✅ 内容被过滤时不重试
- ✅ 避免浪费积分
- ✅ 继续下一个批次（不停止整个任务）

---

### 4. **空数组检查** ⭐⭐

**位置**: `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`

**机制**:
- 如果 API 返回空数组，**不会继续调用下一个批次**
- 会触发 fallback 到更强大的模型（但不会重复调用同一个模型）

**代码**:
```typescript
// 🔥 强制检查：如果返回空数组，立即触发 fallback（最高优先级）
if (scenes.length === 0) {
  console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 严重问题：gemini-2.5-flash 返回空数组！`)
  console.error(`[${industry}] 批次 ${batch + 1}: 将强制切换到 gemini-3-flash（联网搜索）以避免浪费积分`)
  needsFallback = true
  // 不会继续调用下一个批次，而是切换到更强大的模型
}
```

**效果**:
- ✅ 空数组时不会继续调用同一个模型
- ✅ 会切换到更强大的模型（但只切换一次）
- ✅ 避免重复调用浪费积分

---

### 5. **错误分类和智能重试** ⭐

**位置**: `lib/grsai/client.ts` 和 `app/api/admin/batch-generation/process/generate-and-save-scenes.ts`

**机制**:
- 根据错误类型决定是否重试
- 某些错误（如内容被过滤）不应该重试

**错误分类**:

| 错误类型 | 是否重试 | 说明 |
|---------|---------|------|
| 超时 | ✅ 是 | 可以重试 |
| 网络错误 | ✅ 是 | 可以重试 |
| **内容被过滤** | ❌ **否** | **不应该重试（会浪费积分）** |
| 速率限制 (429) | ✅ 是 | 等待后重试 |
| 服务器错误 (5xx) | ✅ 是 | 可以重试 |
| 认证错误 (401/403) | ❌ 否 | 配置问题，不应该重试 |

**效果**:
- ✅ 智能决定是否重试
- ✅ 避免浪费积分（内容被过滤时不重试）
- ✅ 提高成功率（网络错误时重试）

---

### 6. **速率限制器** ⭐

**位置**: `lib/grsai/rate-limiter.ts`

**机制**:
- 限制并发请求数（最多 3 个）
- 最小请求间隔 1 秒
- 避免触发 429 错误（速率限制）

**效果**:
- ✅ 避免触发 429 错误
- ✅ 减少不必要的 API 调用
- ✅ 提高成功率

---

## 📊 保护机制总结

### 防止空烧的场景

| 场景 | 保护机制 | 效果 |
|------|---------|------|
| 保存失败率 > 50% | 立即停止生成 | ✅ 不会继续调用 API |
| 任务已停止 | 立即停止生成 | ✅ 不会继续调用 API |
| 内容被过滤 | 不重试，跳过批次 | ✅ 不会重复调用 |
| 返回空数组 | 切换到更强大模型（只一次） | ✅ 不会重复调用 |
| 速率限制 | 等待后重试 | ✅ 避免触发 429 |
| 任务已暂停 | 等待恢复或超时退出 | ✅ 不会继续调用 |

---

## 🔍 代码验证

### 1. 保存失败率检查（3 处）

```typescript
// gemini-2.5-flash
if (saveFailureRate > 0.5) {
  break // 停止整个循环
}

// gemini-3-flash
if (saveFailureRate > 0.5) {
  break // 停止整个循环
}

// gemini-3-pro
if (saveFailureRate > 0.5) {
  break // 停止整个循环
}
```

### 2. 任务停止检查（2 处）

```typescript
// 生成前检查
if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
  break
}

// 保存前检查
if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
  break
}
```

### 3. 内容被过滤检查

```typescript
if (errorClassification.errorCategory === 'content_filter') {
  continue // 跳过此批次，不重试
}
```

---

## ✅ 结论

**不会空烧调用 API！** 代码中实现了**6层保护机制**：

1. ✅ **保存失败率检查** - 如果 > 50%，立即停止
2. ✅ **任务停止检查** - 如果已停止，立即停止
3. ✅ **内容被过滤不重试** - 避免浪费积分
4. ✅ **空数组检查** - 不会重复调用
5. ✅ **错误分类** - 智能决定是否重试
6. ✅ **速率限制** - 避免触发 429

这些保护机制确保：
- ✅ 不会在保存失败时继续调用 API
- ✅ 不会在任务停止时继续调用 API
- ✅ 不会在内容被过滤时重试
- ✅ 不会在返回空数组时重复调用

**你的积分是安全的！** 🛡️

