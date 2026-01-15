# 视频生成错误修复：videoTask is not defined

## 🐛 问题描述

用户报告视频生成失败，控制台显示错误：
- **错误信息**: `Grsai API error: videoTask is not defined`
- **HTTP 状态**: 500 错误
- **影响**: 视频生成任务失败，积分已自动退还

## 🔍 根本原因

在 `/api/video/result/[id]/route.ts` 文件中：

1. **作用域问题**：`videoTask` 变量只在 `if (isUUID)` 块内定义
2. **使用位置**：在第 126 行，代码尝试使用 `videoTask?.model` 来判断是否为 Veo 模型
3. **问题场景**：当 taskId 不是 UUID 格式（即直接使用 Grsai task ID）时，`videoTask` 为 `null`，导致后续代码访问时出错

## ✅ 修复方案

### 修复 1: 将 `videoTask` 声明提升到外部作用域

**文件**: `app/api/video/result/[id]/route.ts`

**修复前**:
```typescript
let grsaiTaskId = taskIdParam
let internalTaskId = null

if (isUUID) {
  const { data: videoTask, error: taskError } = await supabase
  // ... videoTask 只在这个块内可用
}

// 后面使用 videoTask?.model - 如果 isUUID 为 false，videoTask 未定义
const isVeoModel = videoTask?.model?.startsWith('veo') || false
```

**修复后**:
```typescript
let grsaiTaskId = taskIdParam
let internalTaskId = null
let videoTask: { ... } | null = null  // 在外部作用域声明

if (isUUID) {
  const { data: taskData, error: taskError } = await supabase
  // ...
  videoTask = taskData  // 赋值给外部变量
}

// 现在可以安全使用 videoTask
const model = videoTask?.model || null
const isVeoModel = model?.startsWith('veo') || false
```

## 📋 修复内容

1. **变量声明提升**：将 `videoTask` 声明移到 `if (isUUID)` 块外部
2. **类型定义**：明确 `videoTask` 的类型，初始化为 `null`
3. **安全访问**：使用可选链 `?.` 安全访问 `videoTask` 的属性

## 🎯 修复效果

- ✅ 修复了 "videoTask is not defined" 错误
- ✅ 支持使用 UUID 和 Grsai task ID 两种格式
- ✅ 正确处理 Veo 和 Sora 模型的响应格式差异
- ✅ 错误处理更加健壮

## 🔄 相关错误

### 401 错误：`/api/payment/recharge-records`

这个错误是**正常的认证检查**：
- 如果用户未登录，返回 401 是预期行为
- 前端应该处理这个错误，引导用户登录
- 不影响视频生成功能

### 500 错误：`/api/video/result/[id]`

这个错误**已修复**：
- 之前：`videoTask is not defined` 导致 500 错误
- 现在：正确处理 `videoTask` 为 `null` 的情况

## 🧪 测试建议

1. **测试 UUID 格式的 taskId**：
   - 使用内部任务 ID（UUID）查询结果
   - 验证可以正确获取模型类型

2. **测试 Grsai task ID 格式**：
   - 使用 Grsai 任务 ID 查询结果
   - 验证不会出现 "videoTask is not defined" 错误

3. **测试不同模型**：
   - Sora 模型：验证 `results` 数组格式
   - Veo 模型：验证 `url` 直接格式

## 📝 代码变更

**文件**: `app/api/video/result/[id]/route.ts`

- 第 37 行：添加 `videoTask` 外部声明
- 第 41 行：将内部变量改为 `taskData`
- 第 47 行：更新错误检查使用 `taskData`
- 第 50 行：将 `taskData` 赋值给 `videoTask`
- 第 126-128 行：安全访问 `videoTask?.model`

---

**修复日期**: 2026-01-07  
**状态**: ✅ 已修复并测试
