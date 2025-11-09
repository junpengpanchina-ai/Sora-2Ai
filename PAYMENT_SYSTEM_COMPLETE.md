# 付费系统集成完成

## ✅ 已完成的工作

### 支付系统集成
- ✅ 集成 Stripe 支付系统
  - 使用 Stripe Checkout 处理支付
  - 支持信用卡支付
  - 自动处理支付成功和失败回调
  - 详细配置说明请查看 `STRIPE_SETUP.md`

### 1. 数据库迁移
- ✅ 创建了积分系统数据库迁移文件
  - 文件位置: `supabase/migrations/004_add_credits_system.sql`
  - 在 `users` 表中添加了 `credits` 字段（积分余额）
  - 创建了 `recharge_records` 表（充值记录）
  - 创建了 `consumption_records` 表（消费记录）
  - 已创建必要的索引和触发器

### 2. 类型定义
- ✅ 更新了数据库类型定义
  - 文件位置: `types/database.ts`
  - 添加了 `credits` 字段到 `users` 表
  - 添加了 `recharge_records` 表的完整类型定义
  - 添加了 `consumption_records` 表的完整类型定义

### 3. 积分管理功能
- ✅ 创建了积分管理辅助函数
  - 文件位置: `lib/credits.ts`
  - `deductCredits`: 扣除用户积分并创建消费记录
  - `refundCredits`: 返还用户积分（当视频生成失败时）
  - `refundCreditsByVideoTaskId`: 通过视频任务ID返还积分
  - 视频生成消耗：**10积分/次**

### 4. 充值API
- ✅ 创建了充值API接口
  - 文件位置: `app/api/recharge/route.ts`
  - **POST** `/api/recharge` - 处理充值请求
  - **GET** `/api/recharge` - 获取充值记录
  - 充值比例：**1元 = 100积分**
  - 自动创建充值记录并更新用户积分

### 5. 视频生成API更新
- ✅ 修改了视频生成API
  - 文件位置: `app/api/video/generate/route.ts`
  - 在生成前检查用户积分
  - 在调用API前扣除积分
  - 如果API调用失败，自动返还积分
  - 保存任务到数据库，关联消费记录

### 6. Webhook回调API更新
- ✅ 修改了Webhook回调API
  - 文件位置: `app/api/video/callback/route.ts`
  - 当任务失败时，自动返还积分
  - 更新任务状态和错误信息

### 7. 首页更新
- ✅ 更新了首页组件
  - 文件位置: `app/HomePageClient.tsx`
  - 在导航栏显示用户积分余额
  - 添加了"充值"按钮
  - 添加了价格说明卡片
  - 添加了充值窗口（模态框）
  - 支持快速充值（10元、50元、100元、200元）
  - 实时刷新积分余额（每30秒）

### 8. 视频生成页面更新
- ✅ 更新了视频生成页面
  - 文件位置: `app/video/VideoPageClient.tsx`
  - 在导航栏显示用户积分余额
  - 显示每次生成消耗的积分
  - 积分不足时显示友好错误提示
  - 自动刷新积分余额（每30秒）

### 9. Stats API更新
- ✅ 更新了统计API
  - 文件位置: `app/api/stats/route.ts`
  - 返回用户当前积分余额
  - 支持前端实时更新积分显示

## 📋 价格说明

- **视频生成价格**: 10积分/次
- **充值比例**: 1元 = 100积分
- **实际成本**: ￥0.08~￥0.16/次（不对外公开）
- **说明**: 【无水印】OpenAI 最新发布的 Sora 模型 2.0，OpenAI官方内测，价格暂定，后续价格可能会有变动

## ⚠️ 重要：必须执行的数据库迁移

### 1. 执行数据库迁移 ⚠️ 必须完成

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 打开并执行: `supabase/migrations/004_add_credits_system.sql`

### 2. 验证迁移

执行以下SQL查询验证迁移是否成功：

```sql
-- 检查 users 表是否有 credits 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'credits';

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('recharge_records', 'consumption_records');
```

## 🎯 功能特性

### 充值功能
- 支持自定义充值金额
- 快速充值选项（10元、50元、100元、200元）
- 自动计算获得的积分
- 实时更新积分余额
- 记录所有充值历史

### 积分扣除
- 生成视频前自动检查积分
- 积分不足时阻止生成并提示充值
- 自动扣除积分并创建消费记录
- 生成失败时自动返还积分

### 积分返还
- API调用失败时自动返还
- 视频生成失败时自动返还
- 记录所有返还操作

## 📊 数据库表结构

### users 表（新增字段）
- `credits` (INTEGER): 用户积分余额，默认0

### recharge_records 表
- `id`: 充值记录ID
- `user_id`: 用户ID
- `amount`: 充值金额（元）
- `credits`: 获得的积分
- `payment_method`: 支付方式
- `payment_id`: 支付订单ID
- `status`: 充值状态（pending, completed, failed, cancelled）
- `created_at`: 创建时间
- `completed_at`: 完成时间

### consumption_records 表
- `id`: 消费记录ID
- `user_id`: 用户ID
- `video_task_id`: 关联的视频任务ID
- `credits`: 消费的积分
- `description`: 消费描述
- `status`: 状态（completed, refunded）
- `created_at`: 创建时间
- `refunded_at`: 退款时间

## 🔄 工作流程

### 充值流程
1. 用户在首页点击"充值"按钮
2. 输入充值金额或选择快速充值
3. 调用 `/api/recharge` API
4. 创建充值记录
5. 更新用户积分余额
6. 前端实时更新显示

### 视频生成流程
1. 用户提交生成请求
2. 系统检查用户积分（需要10积分）
3. 如果积分不足，返回错误提示
4. 如果积分足够：
   - 创建视频任务记录
   - 扣除10积分
   - 创建消费记录
   - 调用Grsai API生成视频
5. 如果API调用失败，自动返还积分
6. 如果视频生成失败（通过Webhook），自动返还积分
7. 如果生成成功，积分已扣除，不返还

## 🚀 下一步

1. **执行数据库迁移**（必须）
2. **配置 Stripe 环境变量**（必须）
   - 在 `.env.local` 中添加 `STRIPE_SECRET_KEY`
   - 在 Stripe Dashboard 中配置 Webhook
   - 获取 `STRIPE_WEBHOOK_SECRET` 并添加到环境变量
   - 详细说明请查看 `STRIPE_SETUP.md`
3. **测试充值功能**
4. **测试视频生成和积分扣除**
5. **测试积分返还功能**

## 📝 注意事项

1. 成本信息（￥0.08~￥0.16/次）不要写在GitHub里
2. ✅ 已集成 Stripe 支付系统，支持真实支付
3. ⚠️ Stripe API Key 必须通过环境变量配置，不要提交到 Git
4. 积分余额会实时刷新，但建议在关键操作后手动刷新
5. 所有充值和消费记录都会保存在数据库中，便于后续对账和审计
6. 支付成功后通过 Webhook 自动添加积分，无需手动操作

## 🔗 相关文档

- `STRIPE_SETUP.md` - Stripe 支付系统配置指南
- `supabase/migrations/004_add_credits_system.sql` - 数据库迁移文件

