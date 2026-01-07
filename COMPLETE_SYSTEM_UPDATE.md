# 完整系统更新总结（Veo Flash + Pro，积分制）

## ✅ 已完成的更新

### 1. 积分消耗更新（lib/credits.ts）

- ✅ **Sora**: 10 credits / render
- ✅ **Veo Flash**: 50 credits / render（≈ 5×Sora）
- ✅ **Veo Pro**: 250 credits / render（≈ 25×Sora）
- ✅ 模型类型：`'sora-2' | 'veo-flash' | 'veo-pro'`

### 2. 模型名称统一

- ✅ `lib/credits.ts` - 已更新
- ✅ `lib/starter-pack-limits.ts` - 已更新
- ✅ `lib/starter-access-control.ts` - 已更新
- ✅ `app/video/VideoPageClient.tsx` - 已更新
- ✅ `app/api/video/generate/route.ts` - 已更新（部分）

### 3. 钱包系统数据库 Schema（048_add_credit_wallet_system.sql）

- ✅ `credit_wallet`: 永久积分 + Bonus 积分
- ✅ `credit_ledger`: 账本记录
- ✅ `render_job`: 生成任务（风控）
- ✅ `risk_profile`: 风控画像
- ✅ 核心函数：扣除、添加、检查

### 4. 触发点组件（VeoUpgradeNudge.tsx）

- ✅ 4 种触发点
- ✅ 无感升级文案
- ✅ 完整埋点

## 📋 待完成的更新

### 1. API 层模型映射

需要更新 `app/api/video/generate/route.ts`：
- 在调用 Grsai API 时，将 `veo-flash` 映射为 `veo3.1-fast`
- 将 `veo-pro` 映射为 `veo3.1-pro`

### 2. 更新积分扣除逻辑

需要将现有的 `deductCredits()` 替换为：
- 使用 `deduct_credits_from_wallet()`（优先 Bonus）
- 检查 Bonus 是否可用于模型（Veo Pro 不能用 Bonus）

### 3. 更新充值流程

需要在充值成功时：
- 识别充值档位
- 调用 `add_credits_to_wallet()` 设置永久/Bonus 积分

### 4. 更新定价页面

需要显示 4 档充值包

## 🎯 核心策略

### 定位

- **Sora**: Everyday Creator Model（日常高频）
- **Veo Flash**: Quality Upgrade（更高质、仍然快）
- **Veo Pro**: Final Cut / Studio Grade（最终成片）

### 现金流

- **3 个 Creator 包/月** = 正现金流
- **18 次 Veo Pro/月** = 正现金流

### Starter 无薅点化

- 只能买 1 次 / 账号
- Starter Bonus 仅可用于 Sora + Veo Flash（禁止 Veo Pro）
- 每 24 小时最多：Sora 6 次，Veo Flash 1 次

## 🚀 下一步

1. 执行数据库迁移：`048_add_credit_wallet_system.sql`
2. 更新 API 模型映射
3. 更新积分扣除逻辑
4. 更新充值流程
5. 更新定价页面

