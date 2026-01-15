# 24 小时等待期间检查清单

## ✅ 当前状态总结

- ✅ 网站可访问（首页、Privacy、Terms 都返回 200）
- ✅ DNS TXT 记录已验证
- ✅ SSL 证书有效
- ✅ 首页未强制重定向到登录页
- ⚠️ OAuth Consent Screen 链接配置需要确认（Privacy Policy 和 Terms 链接是否已修正）

---

## ⏰ 等待期间（24 小时内）

### 需要确认的事项

在等待期间，请确认以下配置已正确：

#### 1. OAuth Consent Screen 链接配置（最重要）

**访问**：https://console.cloud.google.com/apis/credentials/consent → **品牌塑造**

**确认**：
- [ ] **应用隐私权政策链接** = `https://sora2aivideos.com/privacy` ✅
- [ ] **应用服务条款链接** = `https://sora2aivideos.com/terms` ✅

**如果这两个链接还是反的，立即修正！**（参考 `CRITICAL_FIX_PRIVACY_TERMS_URLS.md`）

#### 2. Search Console 验证状态

**访问**：https://search.google.com/search-console

**确认**：
- [ ] `sora2aivideos.com` 显示为"已验证"或"Verified"
- [ ] 属性类型是 "Domain"（不是 "URL prefix"）

#### 3. Authorized Domains

**访问**：https://console.cloud.google.com/apis/credentials/consent → **品牌塑造**

**确认**：
- [ ] 已获授权的网域包含：`sora2aivideos.com`
- [ ] 已获授权的网域包含：`hgzpzsiafycwlqrkzbis.supabase.co`

---

## 📅 24 小时后需要做的检查

### 步骤 1：检查 Verification Center 状态（最重要）

**访问**：https://console.cloud.google.com/apis/credentials/consent → **验证中心**

**查看"首页要求"状态**：

- ✅ **绿色勾** = 已通过审核
  - **下一步**：测试实际登录功能
  - **如果登录成功**：恭喜！所有验证已完成 ✅

- ⏳ **黄色/处理中** = 仍在审核中
  - **下一步**：再等待 24 小时
  - **定期检查**：每 4-6 小时检查一次

- ❌ **红色感叹号** = 仍有问题
  - **下一步**：检查以下项：
    1. 确认链接配置已修正（Privacy Policy 和 Terms）
    2. 确认 Search Console 已验证
    3. 如果都已确认，再等待 24 小时
    4. 如果 48 小时后仍显示红色，回复邮件或提交支持请求

### 步骤 2：检查 Publishing Status

**在同一页面查看**：

- [ ] **Publishing status** 是什么？
  - "In production" = ✅ 已发布，所有用户可用
  - "Testing" = ⚠️ 测试模式，只有 Test users 可用

### 步骤 3：实际登录测试（如果 Verification Center 显示绿色）

1. **打开浏览器无痕窗口**
2. **访问**：https://sora2aivideos.com/login
3. **尝试使用 Google 登录**
4. **观察结果**：
   - ✅ 成功登录 → 所有验证已完成
   - ❌ 显示错误 → 检查错误信息，可能需要进一步配置

---

## 📧 如果 48 小时后仍显示红色

### 回复邮件模板

找到 Google Trust and Safety 团队的原始邮件，使用以下模板回复：

```
主题：Re: [原始主题] - 修复已完成，请重新审核

尊敬的 Google Trust and Safety 团队，

我已经完成了"首页要求"相关的所有修复：

1. ✅ 域名所有权验证
   - 已在 Google Search Console 完成域名 sora2aivideos.com 的验证
   - DNS TXT 记录已添加并生效

2. ✅ 首页可访问性
   - 首页 https://sora2aivideos.com/ 已公开可访问（HTTP 200）
   - 隐私政策页面 https://sora2aivideos.com/privacy 可访问（HTTP 200）
   - 服务条款页面 https://sora2aivideos.com/terms 可访问（HTTP 200）
   - 首页未强制重定向到登录页

3. ✅ OAuth Consent Screen 配置
   - Authorized domains 已添加 sora2aivideos.com
   - Privacy policy URL 已设置为 https://sora2aivideos.com/privacy
   - Terms of service URL 已设置为 https://sora2aivideos.com/terms
   - Homepage URL 已设置为 https://sora2aivideos.com

4. ✅ 技术验证结果
   - DNS TXT 记录验证：通过
   - 网站可访问性检查：通过
   - SSL 证书检查：通过

但是 Verification Center 中的"首页要求"状态仍未更新。
请帮助检查并更新验证状态。

谢谢！

[你的名字]
[你的邮箱]
```

---

## 🔔 提醒设置

建议设置以下提醒：

1. **24 小时后**：检查 Verification Center 状态
2. **48 小时后**：如果仍显示红色，回复邮件或提交支持请求

---

## 📋 快速检查命令（24 小时后使用）

在 Cloud Shell 中运行：

```bash
./quick_check_verification.sh
```

或者直接访问：
- Verification Center: https://console.cloud.google.com/apis/credentials/consent → 验证中心
- 实际登录测试: https://sora2aivideos.com/login

---

## ✅ 等待期间检查清单

- [ ] 确认 OAuth Consent Screen 链接配置已修正（Privacy Policy 和 Terms）
- [ ] 确认 Search Console 域名已验证
- [ ] 确认 Authorized Domains 包含 sora2aivideos.com
- [ ] 设置 24 小时后的提醒

---

## 🎯 预期结果

**24 小时后**：
- Verification Center 中的"首页要求"应该从红色变为绿色或黄色
- 如果显示绿色，可以测试实际登录功能
- 如果显示黄色，再等待 24 小时

**48 小时后**：
- 如果仍显示红色，需要主动联系 Google 支持
- 如果显示绿色，所有验证已完成 ✅

---

## 💡 提示

- **耐心等待**：Google 系统更新需要时间，24-48 小时是正常的
- **定期检查**：每 4-6 小时检查一次 Verification Center 状态
- **保持配置正确**：确保所有配置都已正确设置

祝你 24 小时后看到绿色 ✅！
