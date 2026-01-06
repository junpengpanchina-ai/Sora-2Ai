# OAuth 登录验收结果记录

## 📋 验收结果标准化模板

每次按 checklist 验收后，记录一行结果作为历史基线。

---

## ✅ 验收结果记录

### 日期：YYYY-MM-DD

**验收环境：**
- [ ] Production
- [ ] Preview
- [ ] Local

**验收步骤：**
1. [ ] 无痕窗口打开 `/login`
2. [ ] F12 → Network → 搜索 `token`
3. [ ] 点击 "Sign in with Google"
4. [ ] 完成 Google 授权
5. [ ] 回到站点

**关键指标：**

| 指标 | 结果 | 备注 |
|------|------|------|
| `auth/v1/authorize` | ✅/❌ | 状态码：___ |
| `auth/v1/token?grant_type=pkce` | ✅/❌ | 状态码：___ |
| Token 响应包含 `access_token` | ✅/❌ | - |
| Token 响应包含 `refresh_token` | ✅/❌ | - |
| 是否拿到 session | ✅/❌ | - |
| 是否能刷新后保持登录 | ✅/❌ | - |

**错误信息（如果有）：**
- Error Code: ___
- Error Description: ___
- Network Response: ___

**配置检查：**
- [ ] Supabase URL Configuration 正确
- [ ] Google OAuth Consent Screen 状态正常
- [ ] 域名统一（无 www/non-www 混用）
- [ ] Vercel 环境变量配置完整

**数据点（可选）：**
- RES: ___
- 其他性能指标: ___

**验收人：** ___

**备注：**
___

---

## 📊 历史验收记录

### 2025-01-06

**验收环境：** Production

**关键指标：**
- `auth/v1/authorize`: ✅ (302)
- `auth/v1/token?grant_type=pkce`: ✅ (200 OK)
- Token 响应包含 `access_token`: ✅
- Token 响应包含 `refresh_token`: ✅
- 是否拿到 session: ✅
- 是否能刷新后保持登录: ✅

**配置检查：**
- ✅ Supabase URL Configuration 正确
- ✅ Google OAuth Consent Screen 状态正常
- ✅ 域名统一（无 www/non-www 混用）
- ✅ Vercel 环境变量配置完整

**修复内容：**
- 修复 Supabase client 配置（分离 browser/server/service）
- 添加 middleware 绝对放行规则
- 添加 OAuth 错误日志记录
- 添加 debug 面板

**验收人：** System

**备注：**
修复了 "Supabase Client is configured with the accessToken option" 错误，确保浏览器端 client 不传 accessToken。

---

## 🔍 验收失败记录

### 日期：YYYY-MM-DD

**失败原因：**
- [ ] `invalid_client`
- [ ] `redirect_uri_mismatch`
- [ ] `invalid_grant`
- [ ] `server_error`
- [ ] 其他：___

**Network Response：**
```
Status Code: ___
Response Body: ___
```

**修复措施：**
___

**修复后验收：**
- [ ] 已修复
- [ ] 待验证

---

## 📈 趋势分析

定期查看错误日志分布，了解最常见的失败原因：

1. `invalid_client` - 次数：___
2. `redirect_uri_mismatch` - 次数：___
3. `invalid_grant` - 次数：___
4. `server_error` - 次数：___
5. 其他 - 次数：___

**查看方式：**
- Supabase Dashboard → Table Editor → `oauth_error_logs`
- 或 Vercel Logs → 搜索 `[OAuth Error Log]`

