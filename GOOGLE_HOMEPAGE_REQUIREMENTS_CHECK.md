# Google Auth Platform 首页要求检查清单

## ✅ 已符合的要求

### 1. 公开可访问 ✅
- **状态**：✅ 符合
- **检查**：首页 (`app/page.tsx`) 不需要登录即可访问
- **验证**：访问 `https://sora2aivideos.com` 无需认证

### 2. 相关性 ✅
- **状态**：✅ 符合
- **检查**：首页清楚展示应用功能（AI视频生成工具）
- **内容**：
  - 标题："Create High-Quality AI Videos from Text"
  - 描述：清楚说明是文本转视频AI生成器
  - 功能说明：支持多种视频风格和格式

### 3. 有效URL ✅
- **状态**：✅ 符合
- **检查**：使用自己的域名 `sora2aivideos.com`
- **验证**：不是第三方平台子域名（如 `yoursite.google.com`）

### 4. 应用功能描述 ✅
- **状态**：✅ 符合
- **位置**：
  - `app/page.tsx` 中的 metadata 和结构化数据
  - `app/page.tsx` 中的 SEO 文本内容（sr-only section）
  - `app/HomePageClient.tsx` 中的 Hero 部分
- **内容**：清楚描述应用是 AI 视频生成工具

### 5. 隐私政策链接 ✅
- **状态**：✅ 符合
- **位置**：`app/layout.tsx` Footer 中
- **链接**：`/privacy` → `https://sora2aivideos.com/privacy`
- **验证**：链接可访问，页面存在 (`app/privacy/page.tsx`)

### 6. 服务条款链接 ✅
- **状态**：✅ 符合
- **位置**：`app/layout.tsx` Footer 中
- **链接**：`/terms` → `https://sora2aivideos.com/terms`
- **验证**：链接可访问，页面存在 (`app/terms/page.tsx`)

### 7. 数据使用透明度 ✅
- **状态**：✅ 符合
- **位置**：`app/layout.tsx` Footer 中
- **内容**：说明使用 Google Sign-In，只请求邮箱和基本资料
- **额外**：`app/page.tsx` 的 SEO 文本中也包含数据使用说明

---

## ⚠️ 需要手动验证的要求

### 8. 授权域名验证 ⚠️
- **状态**：需要手动检查
- **要求**：域名必须在 Google Search Console 中验证所有权
- **检查步骤**：
  1. 访问：https://search.google.com/search-console
  2. 确认 `sora2aivideos.com` 已添加并验证
  3. 验证方式应该是：
     - DNS 记录验证（推荐）
     - HTML 文件验证
     - HTML 标签验证
  4. 在 Google Cloud Console → OAuth consent screen → Authorized domains 中确认已添加 `sora2aivideos.com`

---

## 🔍 需要确认的配置

### OAuth Consent Screen 配置一致性

根据之前的文档 (`CRITICAL_FIX_PRIVACY_TERMS_URLS.md`)，需要确认：

1. **Google Cloud Console 配置**：
   - [ ] 应用首页：`https://sora2aivideos.com/`
   - [ ] 应用隐私权政策链接：`https://sora2aivideos.com/privacy` ✅（必须与网站 footer 一致）
   - [ ] 应用服务条款链接：`https://sora2aivideos.com/terms` ✅（必须与网站 footer 一致）
   - [ ] 已获授权的网域：`sora2aivideos.com` ✅

2. **网站 Footer 链接**（已确认正确）：
   - ✅ Privacy Policy 链接：`/privacy`
   - ✅ Terms of Service 链接：`/terms`

3. **一致性检查**：
   - [ ] OAuth Consent Screen 的 Privacy Policy URL = 网站 footer 的 Privacy Policy 链接
   - [ ] OAuth Consent Screen 的 Terms of Service URL = 网站 footer 的 Terms of Service 链接

---

## 📋 完整检查清单

### 代码层面（已确认 ✅）
- [x] 首页公开可访问（无需登录）
- [x] 首页有清晰的应用功能描述
- [x] Footer 中有 Privacy Policy 链接
- [x] Footer 中有 Terms of Service 链接
- [x] Footer 中有数据使用透明度说明
- [x] 使用自己的域名（不是第三方子域名）

### Google Cloud Console 配置（需要手动检查 ⚠️）
- [ ] 应用首页 URL 正确：`https://sora2aivideos.com/`
- [ ] Privacy Policy URL 正确：`https://sora2aivideos.com/privacy`
- [ ] Terms of Service URL 正确：`https://sora2aivideos.com/terms`
- [ ] Authorized domains 包含：`sora2aivideos.com`
- [ ] 域名已在 Google Search Console 验证所有权

---

## 🎯 总结

### 代码层面：✅ 完全符合
你的首页代码完全符合 Google Auth Platform 的要求：
- ✅ 公开可访问
- ✅ 有清晰的功能描述
- ✅ 有隐私政策和服务条款链接
- ✅ 有数据使用透明度说明

### 配置层面：⚠️ 需要确认
需要手动检查 Google Cloud Console 的配置：
1. OAuth Consent Screen 中的链接是否正确
2. 域名是否已在 Google Search Console 验证

---

## 🔧 如果遇到"首页未注册到您的名下"错误

如果 Google Verification Center 显示"首页未注册到您的名下"，请检查：

1. **Google Search Console 验证**：
   - 访问：https://search.google.com/search-console
   - 确认 `sora2aivideos.com` 已添加并验证
   - 如果未验证，添加域名并完成验证（DNS 或 HTML 文件）

2. **OAuth Consent Screen 配置**：
   - 访问：https://console.cloud.google.com/apis/credentials/consent
   - 确认所有链接与网站 footer 完全一致
   - 确认 Authorized domains 包含 `sora2aivideos.com`

3. **等待验证更新**：
   - Google 可能需要 24-48 小时重新检查配置
   - 修复后等待一段时间再检查 Verification Center

---

## 📚 参考文档

- Google OAuth Brand Verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- 项目相关文档：
  - `GOOGLE_OAUTH_FIX_CHECKLIST.md` - OAuth 配置检查清单
  - `CRITICAL_FIX_PRIVACY_TERMS_URLS.md` - 链接配置修复指南
