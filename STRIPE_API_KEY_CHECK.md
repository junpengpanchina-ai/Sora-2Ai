# Stripe API Key 诊断指南

## 🔍 快速诊断

### 方法 1: 使用诊断脚本（推荐）

1. 打开浏览器开发者工具 (F12)
2. 切换到 **Console** 标签
3. 复制 `STRIPE_API_KEY_DIAGNOSTIC.js` 文件中的全部代码
4. 粘贴到控制台并回车
5. 查看诊断结果

### 方法 2: 手动检查

在浏览器控制台运行以下代码：

```javascript
// 1. 检查认证状态
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data: { session } } = await supabase.auth.getSession();
console.log('登录状态:', session ? '已登录' : '未登录');
console.log('用户信息:', session?.user);

// 2. 测试 API
const res = await fetch('/api/payment/create-plan-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'starter' })
});
const data = await res.json();
console.log('API 响应:', data);

// 3. 检查错误
if (data.stripeErrorCode === 'api_key_expired') {
  console.error('❌ Stripe API Key 已过期！');
  console.log('需要在 Vercel 环境变量中更新 STRIPE_SECRET_KEY');
}
```

## 🐛 常见错误及解决方案

### 错误 1: `api_key_expired`

**症状：**
```
Expired API Key provided: sk_live_...
stripeErrorCode: 'api_key_expired'
```

**原因：** Stripe API Key 已过期或被撤销

**解决方案：**
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** > **API keys**
3. 检查 Secret Key 状态
4. 如果已过期，创建新的 Secret Key
5. 在 Vercel 中更新 `STRIPE_SECRET_KEY` 环境变量
6. 重新部署应用

### 错误 2: `api_key_invalid`

**症状：**
```
Invalid API Key provided
stripeErrorCode: 'api_key_invalid'
```

**原因：** API Key 格式错误或不属于当前账户

**解决方案：**
1. 确认使用的是正确的 Secret Key（不是 Publishable Key）
2. 确认 Key 以 `sk_live_` 或 `sk_test_` 开头
3. 确认 Key 属于正确的 Stripe 账户
4. 在 Vercel 中重新设置 `STRIPE_SECRET_KEY`

### 错误 3: `401 Unauthorized`

**症状：**
```
status: 401
error: "Unauthorized, please login first"
```

**原因：** 用户未登录或认证 token 无效

**解决方案：**
1. 确保用户已登录
2. 检查浏览器控制台的认证状态
3. 如果已登录但仍报错，尝试刷新页面或重新登录

### 错误 4: `500 Internal Server Error`

**症状：**
```
status: 500
error: "Failed to create checkout session"
```

**原因：** 服务器端错误（可能是 Stripe 配置问题）

**解决方案：**
1. 查看 Vercel 日志获取详细错误信息
2. 检查 `STRIPE_SECRET_KEY` 是否已设置
3. 检查 Stripe API 版本兼容性
4. 查看服务器日志中的详细错误堆栈

## 📋 Vercel 环境变量检查清单

在 Vercel Dashboard 中确认以下环境变量已设置：

- ✅ `STRIPE_SECRET_KEY` - Stripe Secret Key (必需)
- ✅ `NEXT_PUBLIC_APP_URL` - 应用 URL (用于回调)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key

## 🔧 更新 Stripe API Key 步骤

1. **获取新的 API Key**
   - 登录 Stripe Dashboard
   - 进入 Developers > API keys
   - 创建新的 Secret Key 或使用现有的有效密钥

2. **在 Vercel 中更新**
   ```
   Vercel Dashboard > 项目 > Settings > Environment Variables
   > 找到 STRIPE_SECRET_KEY
   > 点击 Edit
   > 更新值
   > Save
   ```

3. **重新部署**
   - 在 Vercel Dashboard 中点击 **Redeploy**
   - 或等待自动部署（如果已启用）

4. **验证**
   - 等待部署完成
   - 刷新应用页面
   - 再次测试购买功能
   - 查看控制台日志确认错误已解决

## 📞 获取帮助

如果问题仍然存在：

1. 查看浏览器控制台的详细错误日志
2. 查看 Vercel Dashboard 的 Function Logs
3. 检查 Stripe Dashboard 的 API Logs
4. 提供以下信息：
   - 错误消息
   - 浏览器控制台日志
   - Vercel 日志（如果可访问）
   - Stripe API Key 的前 10 个字符（用于确认环境）

