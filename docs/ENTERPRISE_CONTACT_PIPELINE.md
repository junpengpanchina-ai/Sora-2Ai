# Enterprise Contact Pipeline (DB + Email + Admin)

目标：企业/联系表单提交后 **不漏单、可追踪**  
- ✅ 写入 Supabase 表 `contact_requests`（admin 可查）  
- ✅ 发送通知邮件到你的 Gmail（可直接 Reply 给客户）  

---

## 1) Resend 配置（发邮件服务）

### 1.1 域名验证（已做过的话可跳过）

在 Resend 控制台的 **Domains** 添加 `sora2aivideos.com`，并按提示在 DNS 中添加记录：
- DKIM：`resend._domainkey`（TXT）
- SPF：`send`（TXT + MX）

当页面显示：
- `Status: Verified`
- `Enable Sending: On`

就 OK 了。

> `Enable Receiving` 不需要开启（我们只发通知邮件，不用 Resend 收邮件）。  
> `Open Tracking / Click Tracking` 建议保持关闭（更利于送达率）。

---

## 2) 创建 Resend API Key（RESEND_API_KEY）

Resend 控制台 → **API Keys** → **Create API Key**  
复制生成的 key（通常以 `re_` 开头）。

⚠️ 这是密钥：不要提交到 git、不要粘贴到公开渠道。

---

## 3) 环境变量（Vercel / 本地）

### 3.1 线上（Vercel）
Project → Settings → Environment Variables 添加：

- `RESEND_API_KEY` = `re_...`
- `CONTACT_NOTIFY_EMAIL` = `junpengpanchina@gmail.com`
- `CONTACT_FROM_EMAIL` = `Sora2Ai <no-reply@sora2aivideos.com>`
- `CONTACT_RATE_LIMIT_MAX` = `5`（可选，默认 5）
- `CONTACT_RATE_LIMIT_WINDOW_MIN` = `10`（可选，默认 10）

> `CONTACT_FROM_EMAIL` 用你已验证的域名发信更稳定、更像 B2B 正式邮件。

### 3.2 本地（.env.local）

```bash
RESEND_API_KEY=re_xxx
CONTACT_NOTIFY_EMAIL=junpengpanchina@gmail.com
CONTACT_FROM_EMAIL="Sora2Ai <no-reply@sora2aivideos.com>"
CONTACT_RATE_LIMIT_MAX=5
CONTACT_RATE_LIMIT_WINDOW_MIN=10
```

---

## 4) Supabase：创建表 contact_requests

执行 migration：

- `supabase/migrations/116_create_contact_requests.sql`

创建后会有表：
- `contact_requests`

字段包含：
- `intent`（`enterprise-demo` / `enterprise-pricing` / `contact`）
- `name` / `email` / `company` / `message`
- `source_path` / `user_agent` / `ip`
- `status`（默认 `new`）
- `meta`

---

## 5) 表单提交链路（代码已接好）

### 5.1 前端页面

- `/contact`（普通联系）
- `/contact?intent=enterprise-demo`（企业 demo）
- `/contact?intent=enterprise-pricing`（企业报价 / sales）

### 5.2 后端 API

- `POST /api/contact`（`app/api/contact/route.ts`）

行为：
1) 先写入 `contact_requests`  
2) 再发邮件通知到 `CONTACT_NOTIFY_EMAIL`  
3) 邮件 Reply-To 自动设置为客户的 work email

> 如果邮件发送失败：**不会影响用户提交成功**（仍然入库，Admin 能查）。

### 5.3 Anti-abuse（Honeypot）

前端会带一个隐藏字段 `website`：
- 正常用户永远为空
- 如果脚本/机器人自动填了它：后端会直接返回 `ok: true`（但不写库、不发邮件）

---

## 6) Admin 查看（不漏单）

新增 Admin 页面：
- `/admin/contact-requests`

你可以看到最近 200 条提交。

---

## 7) 端到端测试（建议按这个顺序）

1. 打开：
   - `/contact?intent=enterprise-demo`
2. 填表并提交（Name / Work Email / Company / Message）
3. 你应该同时看到：
   - Gmail 收到通知邮件（如收不到，检查 Gmail 的 Promotions / Spam）
   - `/admin/contact-requests` 出现新记录

---

## 8) 常见问题排查

### 8.1 Admin 能看到，但 Gmail 收不到
- 检查 Vercel 环境变量是否已设置：`RESEND_API_KEY`
- Resend 控制台 → Logs 查看发送是否 `blocked/failed`
- 确认 Domain `Verified` 且 `Enable Sending` 已开启

### 8.2 用户提交直接失败（页面提示 Submission failed）
- Supabase migration 是否执行成功（表是否存在）
- `SUPABASE_SERVICE_ROLE_KEY` 是否已在部署环境配置（服务端写库需要）

### 8.3 邮件送达率/进入垃圾箱
- `CONTACT_FROM_EMAIL` 使用已验证域名
- 保持 tracking 关闭
- 逐步提升 DMARC（可选）

---

## 9) 安全注意事项

- `RESEND_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` 都是 **secret**：只放在 Vercel env / `.env.local`  
- 不要提交到 git  

