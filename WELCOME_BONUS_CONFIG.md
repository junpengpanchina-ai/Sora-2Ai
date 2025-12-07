# 新用户注册赠送积分配置说明

## 📋 概述

系统已配置新用户注册时自动赠送 **3 积分**（对应 3 次视频生成机会），遵循 **1 美金 = 1 积分** 的规则。

## 🎯 核心机制

### 1. 积分规则

- **1 美金 = 10 积分**
- **新用户注册赠送：30 积分**（对应 3 美金）
- **视频生成消耗：10 积分/次**
- **新用户可生成：3 次视频**（30 积分 ÷ 10 积分/次 = 3 次）

### 2. 积分换算示例

- 39.9 美金 = 399 积分
- 200 美金 = 2000 积分
- 3 美金 = 30 积分（新用户注册赠送）

### 2. 自动赠送流程

当新用户首次注册/登录时：

1. **创建用户记录**：在 `users` 表中创建新用户，初始积分为 0
2. **赠送欢迎积分**：自动调用 `addWelcomeBonus()` 函数
3. **创建充值记录**：在 `recharge_records` 表中创建记录
   - `amount`: 3.00（对应 3 美金，1美金 = 10积分）
   - `credits`: 30（对应 30 积分）
   - `payment_method`: `welcome_bonus`
   - `payment_id`: `welcome_{userId}_{timestamp}`
   - `status`: `completed`（立即完成）
4. **更新用户积分**：将用户积分从 0 更新为 30

### 3. 数据库记录

所有操作都会实时记录到数据库：

- **用户积分更新**：`users.credits` 字段实时更新
- **充值记录**：`recharge_records` 表中创建完整记录
- **时间戳**：`completed_at` 记录赠送时间

## 🔧 代码实现

### 核心函数

**文件：`lib/credits.ts`**

// 新用户注册赠送的积分（30积分 = 3美金 = 3次视频生成机会，每次消耗10积分）
// 1美金 = 10积分
export const WELCOME_BONUS_CREDITS = 30

// 赠送欢迎积分函数
export async function addWelcomeBonus(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ success: boolean; error?: string; rechargeRecordId?: string }>
```

**文件：`lib/user.ts`**

在 `getOrCreateUser()` 函数中，创建新用户后自动调用：

```typescript
// 给新用户赠送欢迎积分（30积分 = 3美金 = 3次视频生成机会，每次生成消耗10积分）
// 1美金 = 10积分
const welcomeBonusResult = await addWelcomeBonus(supabase, newUser.id)
if (welcomeBonusResult.success) {
  console.log('[getOrCreateUser] Welcome bonus added successfully')
  newUser.credits = (newUser.credits || 0) + 30
}
```

## 📊 数据库结构

### 充值记录表 (`recharge_records`)

| 字段 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `user_id` | UUID | 用户ID | `xxx-xxx-xxx` |
| `amount` | DECIMAL(10,2) | 金额（美金） | `3.00`（1美金 = 10积分） |
| `credits` | INTEGER | 积分 | `30` |
| `payment_method` | TEXT | 支付方式 | `welcome_bonus` |
| `payment_id` | TEXT | 支付订单ID | `welcome_{userId}_{timestamp}` |
| `status` | TEXT | 状态 | `completed` |
| `completed_at` | TIMESTAMPTZ | 完成时间 | `2024-01-15T10:30:00Z` |

### 用户表 (`users`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `credits` | INTEGER | 用户积分（实时更新） |

## ✅ 验证步骤

### 1. 测试新用户注册

1. 使用新的 Google 账号登录
2. 检查用户积分是否为 30
3. 检查 `recharge_records` 表中是否有 `payment_method = 'welcome_bonus'` 的记录
4. 验证可以生成 3 次视频（30 积分 ÷ 10 积分/次 = 3 次）

### 2. 查询充值记录

```sql
-- 查看所有新用户注册赠送记录
SELECT 
  id,
  user_id,
  amount,
  credits,
  payment_method,
  payment_id,
  status,
  completed_at,
  created_at
FROM recharge_records
WHERE payment_method = 'welcome_bonus'
ORDER BY created_at DESC;
```

### 3. 验证用户积分

```sql
-- 查看用户积分和充值记录
SELECT 
  u.id,
  u.email,
  u.credits,
  COUNT(r.id) as recharge_count,
  SUM(CASE WHEN r.payment_method = 'welcome_bonus' THEN 1 ELSE 0 END) as welcome_bonus_count
FROM users u
LEFT JOIN recharge_records r ON r.user_id = u.id
WHERE u.credits > 0
GROUP BY u.id, u.email, u.credits
ORDER BY u.created_at DESC;
```

## 🚨 注意事项

### 1. 避免重复赠送

当前实现中，`getOrCreateUser()` 函数会检查用户是否已存在：
- 如果用户已存在，**不会**再次赠送积分
- 只有**新创建的用户**才会获得欢迎积分

### 2. 积分消耗规则

当前系统配置：
- **视频生成消耗**：10 积分/次
- **新用户赠送**：30 积分
- **可生成次数**：3 次（30 积分 ÷ 10 积分/次 = 3 次）

✅ 配置正确：新用户注册后可以生成 3 次视频。

### 3. 数据库事务

`addWelcomeBonus()` 函数使用两步操作：
1. 创建充值记录
2. 更新用户积分

如果第二步失败，会删除充值记录，确保数据一致性。

## 🔄 迁移文件

**文件：`supabase/migrations/014_add_welcome_bonus_support.sql`**

此迁移文件确保系统支持 `welcome_bonus` 支付方式，并添加相关注释。

## 📝 配置修改

如果需要修改赠送积分数量，编辑 `lib/credits.ts`：

```typescript
// 修改这个常量
export const WELCOME_BONUS_CREDITS = 30  // 改为其他值，如 50（可生成5次）
```

**计算规则**：
- 赠送积分 = 期望生成次数 × 10（每次生成消耗10积分）
- 对应美金 = 赠送积分 ÷ 10（1美金 = 10积分）
- 例如：想要5次生成机会 = 5 × 10 = 50 积分 = 5 美金

## 🎯 长尾词页面说明

长尾词页面用于 Google 抓取，但**本质上要避开绝对意义上的免费**：

- ✅ 新用户注册可以免费得到 3 次生成视频机会（对应 3 美金 = 30 积分，1美金 = 10积分，每次生成消耗10积分）
- ✅ 需要登录新账号才能获得积分
- ✅ 数据库实时记录所有操作
- ❌ 不是"完全免费"，而是"新用户注册赠送"

这样既能让 Google 抓取长尾词页面，又能引导用户注册，同时避免"完全免费"的表述。

---

**最后更新**：2024-01-15  
**版本**：1.0.0

