# 支付流程说明

## 用户充值 39 美金的完整流程

### 1. 用户点击购买（$39 套餐）

**触发点**：用户点击 "Buy Now" 按钮

**系统操作**：
- 调用 `/api/payment/payment-link` API
- 创建充值记录到 `recharge_records` 表：
  ```sql
  INSERT INTO recharge_records (
    user_id,
    amount,        -- 39 (美元)
    credits,       -- 500 (积分，50条视频 * 10积分/视频)
    payment_method, -- 'stripe_payment_link'
    payment_id,    -- Payment Link ID
    status         -- 'pending' (等待支付)
  )
  ```
- 返回 Stripe Payment Link URL
- 用户跳转到 Stripe 支付页面

### 2. 用户完成支付

**在 Stripe 端**：
- 用户输入支付信息
- Stripe 处理支付
- 支付成功后，Stripe 发送 Webhook 到我们的服务器

### 3. Webhook 自动处理（主要方式）

**触发点**：Stripe 发送 `checkout.session.completed` 事件

**系统操作**（`/api/payment/webhook`）：
1. **验证 Webhook 签名**（使用您的 Stripe 密钥）
2. **查找充值记录**：
   - 通过 `client_reference_id` 或 `customer_email` 找到对应的充值记录
3. **更新用户积分**：
   ```sql
   UPDATE users 
   SET credits = credits + 500  -- 增加 500 积分
   WHERE id = user_id
   ```
4. **更新充值记录状态**：
   ```sql
   UPDATE recharge_records 
   SET status = 'completed',
       completed_at = NOW(),
       payment_id = session_id
   WHERE id = recharge_id
   ```

### 4. 数据库记录

**充值记录表 (`recharge_records`)**：
```json
{
  "id": "xxx-xxx-xxx",
  "user_id": "user-uuid",
  "amount": 39.00,
  "credits": 500,
  "payment_method": "stripe_payment_link",
  "payment_id": "dRmcN55nY4k33WXfPa0kE03",
  "status": "completed",
  "created_at": "2025-01-10T10:00:00Z",
  "completed_at": "2025-01-10T10:05:00Z"
}
```

**用户表 (`users`)**：
```json
{
  "id": "user-uuid",
  "credits": 500,  // 积分已增加
  "email": "user@example.com",
  ...
}
```

## 完整数据流

```
用户点击购买 $39 套餐
  ↓
创建充值记录 (status: pending)
  amount: 39 USD
  credits: 500
  ↓
用户跳转到 Stripe 支付
  ↓
用户完成支付
  ↓
Stripe 发送 Webhook
  ↓
系统接收 Webhook
  ↓
更新 users.credits = credits + 500 ✅
  ↓
更新 recharge_records.status = 'completed' ✅
  ↓
记录 completed_at 时间戳 ✅
```

## 数据表结构

### recharge_records（充值记录表）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | UUID | 充值记录ID | xxx-xxx-xxx |
| user_id | UUID | 用户ID | user-uuid |
| amount | DECIMAL(10,2) | 充值金额（美元） | 39.00 |
| credits | INTEGER | 获得的积分 | 500 |
| payment_method | TEXT | 支付方式 | stripe_payment_link |
| payment_id | TEXT | Stripe Payment Link ID | dRmcN55nY4k33WXfPa0kE03 |
| status | TEXT | 状态 | pending/completed/failed |
| created_at | TIMESTAMP | 创建时间 | 2025-01-10 10:00:00 |
| completed_at | TIMESTAMP | 完成时间 | 2025-01-10 10:05:00 |

### users（用户表）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | UUID | 用户ID | user-uuid |
| credits | INTEGER | 当前积分 | 500 |
| email | TEXT | 用户邮箱 | user@example.com |
| ... | ... | 其他字段 | ... |

## 验证方式

### 1. 查看充值记录

```sql
SELECT * FROM recharge_records 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

### 2. 查看用户积分

```sql
SELECT id, email, credits 
FROM users 
WHERE id = 'user-uuid';
```

### 3. 通过 API 查询

```bash
# 查询充值记录
GET /api/payment/check-recharge?recharge_id=xxx

# 查询用户统计（包含积分）
GET /api/stats
```

## 安全保障

1. **Webhook 签名验证**：使用 Stripe Webhook Secret 验证请求真实性
2. **防重复处理**：检查充值记录状态，避免重复添加积分
3. **事务安全**：先更新积分，再更新充值记录状态
4. **用户验证**：确保只有充值记录的所有者才能查询

## 总结

✅ **用户充值 39 美金后**：
1. ✅ Supabase 数据库会记录充值情况（`recharge_records` 表）
2. ✅ 系统会自动给用户增加 500 积分（`users.credits` 字段）
3. ✅ 充值记录状态会更新为 `completed`
4. ✅ 记录完成时间 `completed_at`

整个过程是**自动化的**，无需手动操作！

