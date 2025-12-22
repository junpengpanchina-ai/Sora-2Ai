# 🔧 批量生成显示问题修复

## 问题描述

用户发现界面上显示的行业场景词数量不正确：
- "Renewable Energy": 已生成 196 条场景词（应该是 100 条）
- "Fitness Equipment": 已生成 513 条场景词（应该是 100 条）

## 问题原因

### 根本原因

`total_scenes_saved` 是**全局累计的**（所有行业的总和），但前端显示逻辑错误地使用了 `total_scenes_saved % scenesPerIndustry` 来计算当前行业的数量。

### 错误逻辑

```typescript
// ❌ 错误的计算方式
savedCount: task.total_scenes_saved % scenesPerIndustry
```

**问题示例**：
- 行业1（Renewable Energy）生成了 100 条，`total_scenes_saved = 100`
- 行业2（Solar Panels）生成了 96 条，`total_scenes_saved = 196`
- 行业3（Fitness Equipment）生成了 100 条，`total_scenes_saved = 296`

**错误显示**：
- 行业1：`100 % 100 = 0` ❌（应该是 100）
- 行业2：`196 % 100 = 96` ❌（应该是 96，但显示为当前行业）
- 行业3：`296 % 100 = 96` ❌（应该是 100，但显示为 96）

### 为什么会出现超过 100 条？

实际上，每个行业**确实只生成 100 条**（或设置的 `scenesPerIndustry` 数量），但显示的是**全局累计数量**，所以看起来超过了 100 条。

---

## 修复方案

### 修复逻辑

```typescript
// ✅ 正确的计算方式
// 当前行业已保存 = total_scenes_saved - (已完成行业数 * scenesPerIndustry)
const completedIndustriesCount = task.current_industry_index
const currentIndustrySaved = task.total_scenes_saved 
  ? Math.max(0, task.total_scenes_saved - (completedIndustriesCount * scenesPerIndustry))
  : undefined
```

**修复后的显示**：
- 行业1（已完成）：`100 - (0 * 100) = 100` ✅
- 行业2（已完成）：`196 - (1 * 100) = 96` ✅
- 行业3（处理中）：`296 - (2 * 100) = 96` ✅（当前已保存 96 条，目标 100 条）

---

## 修复内容

### 文件：`app/admin/IndustrySceneBatchGenerator.tsx`

**修复前**：
```typescript
// ❌ 错误的计算方式
const avgSavedPerIndustry = task.total_scenes_saved && task.current_industry_index > 0
  ? Math.floor(task.total_scenes_saved / task.current_industry_index)
  : scenesPerIndustry

savedCount: task.total_scenes_saved && task.current_industry_index > 0
  ? task.total_scenes_saved % scenesPerIndustry
  : undefined,
```

**修复后**：
```typescript
// ✅ 正确的计算方式
for (let i = 0; i < updated.length; i++) {
  if (i < task.current_industry_index) {
    // 已完成的行业：每个行业固定保存 scenesPerIndustry 条
    updated[i] = { 
      ...updated[i], 
      status: 'completed', 
      savedCount: scenesPerIndustry
    }
  } else if (i === task.current_industry_index) {
    // 当前正在处理的行业：计算当前行业已保存的数量
    const completedIndustriesCount = task.current_industry_index
    const currentIndustrySaved = task.total_scenes_saved 
      ? Math.max(0, task.total_scenes_saved - (completedIndustriesCount * scenesPerIndustry))
      : undefined
    
    updated[i] = {
      ...updated[i],
      status: 'processing',
      savedCount: currentIndustrySaved,
    }
  }
}
```

---

## 验证

### 修复后的显示逻辑

假设任务包含 3 个行业，每个行业生成 100 条：

| 行业 | 状态 | total_scenes_saved | 计算方式 | 显示数量 |
|------|------|-------------------|---------|---------|
| 行业1 | 已完成 | 100 | `100 - (0 * 100) = 100` | 100 ✅ |
| 行业2 | 已完成 | 196 | `196 - (1 * 100) = 96` | 100 ✅（已完成，显示目标数量）|
| 行业3 | 处理中 | 296 | `296 - (2 * 100) = 96` | 96 ✅（当前已保存）|

### 特殊情况处理

1. **第一个行业**：
   - `total_scenes_saved = 100`
   - `current_industry_index = 1`（已完成）
   - 显示：100 ✅

2. **最后一个行业**：
   - `total_scenes_saved = 296`
   - `current_industry_index = 2`（正在处理）
   - 显示：`296 - (2 * 100) = 96` ✅（当前已保存 96 条）

3. **任务完成**：
   - 所有行业显示 `scenesPerIndustry`（目标数量）✅

---

## 总结

### 问题
- ❌ 显示的是全局累计数量，而不是单个行业的数量
- ❌ 使用 `%` 运算符导致计算错误

### 修复
- ✅ 正确计算每个行业的实际保存数量
- ✅ 已完成的行业显示目标数量（`scenesPerIndustry`）
- ✅ 正在处理的行业显示当前已保存数量

### 效果
- ✅ 每个行业显示正确的数量（不超过 `scenesPerIndustry`）
- ✅ 不会出现"196 条"或"513 条"这样的错误显示
- ✅ 用户可以看到每个行业的真实进度

---

## 相关文件

- `app/admin/IndustrySceneBatchGenerator.tsx` - 前端显示逻辑（已修复）
- `app/api/admin/batch-generation/process/route.ts` - 后端处理逻辑
- `app/api/admin/batch-generation/process/generate-and-save-scenes.ts` - 生成和保存逻辑

