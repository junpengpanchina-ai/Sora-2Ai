# 📋 Stripe Payment Links 配置 - 分步截图指南

## 快速参考：4 个 Payment Links

| 档位 | 金额 | Payment Link URL |
|------|------|----------------|
| Starter | $*.** | https://buy.stripe.com/***** |
| Creator | $**.** | https://buy.stripe.com/***** |
| Studio | $**.** | https://buy.stripe.com/***** |
| Pro | $**.** | https://buy.stripe.com/***** |

## 详细配置步骤

### 步骤 1: 登录 Stripe Dashboard

1. 访问 https://dashboard.stripe.com
2. 登录你的账号
3. **确认模式**: 右上角应该显示 "Test mode" 或 "Live mode"

### 步骤 2: 进入 Payment Links

**路径**: 左侧菜单 → **"Payment Links"**

如果看不到：
- 点击 **"Products"** → **"Payment Links"**
- 或使用搜索框搜索 "Payment Links"

### 步骤 3: 编辑每个 Payment Link

#### 对于每个 Payment Link，执行以下操作：

1. **找到对应的链接**
   - 点击链接进入详情页
   - 或点击链接右侧的 **"..."** → **"Edit"**

2. **进入编辑模式**
   - 点击右上角的 **"Edit"** 按钮
   - 或点击 **"Settings"** 标签

3. **找到 "After payment" 部分**
   - 滚动页面找到 **"After payment"** 或 **"Redirects"** 部分
   - 可能在不同位置，常见位置：
     - 在 "Checkout settings" 下方
     - 在 "Payment settings" 下方
     - 在独立的 "Redirects" 标签中

4. **设置 Success URL**
   ```
   https://*****/billing/success?session_id={CHECKOUT_SESSION_ID}
   ```
   - 粘贴到 **"Success URL"** 或 **"Redirect URL"** 字段
   - **重要**: `{CHECKOUT_SESSION_ID}` 是 Stripe 的占位符，必须保留
   - 请替换为你的实际域名

5. **设置 Cancel URL**
   ```
   https://*****/pricing?canceled=1
   ```
   - 粘贴到 **"Cancel URL"** 字段
   - 请替换为你的实际域名

6. **保存**
   - 点击 **"Save"** 或 **"Update"** 按钮
   - 等待保存成功提示

### 步骤 4: 验证配置

对每个 Payment Link，验证：
- ✅ Success URL 已设置
- ✅ Cancel URL 已设置
- ✅ URL 中的域名是你的实际域名

---

## 🔑 获取 Stripe Secret Key

### 在 Stripe Dashboard:

1. **进入 API Keys 页面**
   - 左侧菜单 → **"Developers"** → **"API keys"**

2. **选择环境**
   - **Test mode**: 使用测试环境的 key（`sk_test_*****`）
   - **Live mode**: 使用生产环境的 key（`sk_live_*****`）

3. **复制 Secret Key**
   - 找到 **"Secret key"** 部分
   - 点击 **"Reveal test key"** 或 **"Reveal live key"**
   - 点击 **"Copy"** 复制完整的 key
   - **安全提示**: 不要分享这个 key，它等同于你的账号密码

---

## ⚙️ Vercel 环境变量设置

### 步骤 1: 进入项目设置

1. 访问 https://vercel.com/dashboard
2. 点击你的项目（Sora-2Ai）
3. 顶部菜单 → **"Settings"**

### 步骤 2: 添加环境变量

1. 左侧菜单 → **"Environment Variables"**
2. 点击 **"Add New"** 按钮（通常在右上角）

3. **填写表单**:
   ```
   Key: STRIPE_SECRET_KEY
   Value: sk_test_***** (或 sk_live_*****)
   Environment: [勾选所有] Production, Preview, Development
   ```

4. 点击 **"Save"**

### 步骤 3: 重新部署

**方法 A: 通过 Dashboard**
- Deployments → 最新部署 → "..." → "Redeploy"

**方法 B: 通过 Git**
```bash
git commit --allow-empty -m "Redeploy for env vars"
git push
```

---

## ✅ 最终检查清单

### Stripe 配置
- [ ] 4 个 Payment Links 都已设置 Success URL
- [ ] 4 个 Payment Links 都已设置 Cancel URL
- [ ] URL 中的域名正确
- [ ] `{CHECKOUT_SESSION_ID}` 占位符保留

### Vercel 配置
- [ ] `STRIPE_SECRET_KEY` 已添加
- [ ] 环境变量在所有环境都可用
- [ ] 项目已重新部署
- [ ] 部署状态为 "Ready"

### 测试
- [ ] 使用测试卡完成一次支付
- [ ] 支付成功后跳转到正确页面
- [ ] 积分正确入账

---

## 🆘 如果遇到问题

### Payment Link 找不到设置选项
- 尝试创建新的 Payment Link
- 检查 Stripe 账号权限
- 联系 Stripe 支持

### 环境变量不生效
- 确认已重新部署
- 检查变量名拼写：`STRIPE_SECRET_KEY`
- 清除浏览器缓存

### 支付后没有跳转
- 检查 Success URL 是否正确
- 确认域名可以访问
- 查看浏览器控制台错误

---

**完成这些步骤后，你的支付系统就可以正常工作了！** 🎉

