# 🔄 Stripe Payment Link 替代方案

如果找不到 "After payment" 设置选项，可以使用以下替代方案：

## 方案 1: 使用 Stripe Checkout Session（推荐）

如果 Payment Link 不支持自定义重定向，可以改用 Checkout Session：

### 创建 Checkout Session API

在 `app/api/payment/create-checkout/route.ts` 中，你已经有了创建 Checkout Session 的代码。可以修改为：

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: planTitle,
        },
        unit_amount: Math.round(priceUsd * 100), // 转换为分
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing?canceled=1`,
  // ... 其他配置
});
```

### 更新定价页面

修改 `app/pricing/page.tsx`，改为调用 API 而不是直接跳转：

```typescript
onCheckout={async (planId: PlanId) => {
  try {
    const res = await fetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    }
  } catch (error) {
    console.error('Failed to create checkout:', error);
  }
}}
```

## 方案 2: 使用 Webhook 处理（最可靠）

即使 Payment Link 没有设置重定向，也可以通过 Webhook 处理：

### 实现 Webhook Handler

创建 `app/api/stripe/webhook/route.ts`：

```typescript
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { itemIdFromAmount, getPlanConfig } from '@/lib/billing/config';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // 处理支付成功逻辑（与 /api/billing/finalize 相同）
    // ...
  }

  return NextResponse.json({ received: true });
}
```

### 配置 Webhook

1. 在 Stripe Dashboard → **Developers** → **Webhooks**
2. 点击 **"Add endpoint"**
3. 设置 Endpoint URL: `https://sora2aivideos.com/api/stripe/webhook`
4. 选择事件：`checkout.session.completed`
5. 复制 Webhook signing secret 到环境变量：`STRIPE_WEBHOOK_SECRET`

## 方案 3: 检查 Payment Link 版本

某些旧版本的 Payment Link 可能不支持自定义重定向。检查方法：

1. 在 Payment Link 详情页，查看 URL 或版本信息
2. 如果显示 "Legacy" 或旧版本，考虑创建新的 Payment Link

## 🎯 推荐方案

**最佳方案**：使用 **Checkout Session**（方案 1）
- ✅ 完全控制重定向 URL
- ✅ 支持自定义元数据
- ✅ 更灵活的配置选项
- ✅ 与你现有的代码兼容

**备选方案**：使用 **Webhook**（方案 2）
- ✅ 即使用户关闭页面也能处理
- ✅ 最可靠的支付处理方式
- ✅ 支持所有支付场景

## 📝 快速实施 Checkout Session 方案

如果你选择方案 1，我可以：
1. 更新 `app/api/payment/create-checkout/route.ts` 使用新的配置
2. 更新 `app/pricing/page.tsx` 调用 API 而不是直接跳转
3. 确保所有档位都正确映射

告诉我你想用哪个方案，我可以立即帮你实现！

