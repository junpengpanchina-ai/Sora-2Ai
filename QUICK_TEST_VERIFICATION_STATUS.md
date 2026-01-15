# 快速测试审核状态指南

## ⚡ 3 种快速测试方法（按速度排序）

---

## 方法 1：直接检查 Verification Center（最快，30 秒）

### 步骤：

1. **访问 Verification Center**：
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **点击左侧菜单**："验证中心" 或 "Verification Center"

3. **查看"首页要求"状态**：
   - ✅ **绿色勾** = 已通过审核 ✅
   - ⏳ **黄色/处理中** = 正在审核（等待即可）
   - ❌ **红色感叹号** = 仍有问题（需要修复）

4. **如果显示绿色或黄色**：
   - ✅ 审核已通过或正在进行中
   - ⏳ 等待 24-48 小时完成最终审核

---

## 方法 2：测试 OAuth 登录功能（2 分钟）

### 快速测试脚本（在 Cloud Shell 中运行）：

```bash
# 快速检查 OAuth 配置状态
echo "=== OAuth 审核状态快速检查 ==="
echo ""

# 检查项目配置
gcloud config set project skilled-acolyte-476516-g8

# 检查 OAuth consent screen 状态
echo "1. 检查 OAuth Consent Screen 状态..."
gcloud alpha iap oauth-clients list 2>/dev/null || echo "需要访问网页界面检查"

echo ""
echo "2. 请在浏览器中访问以下链接检查："
echo "   https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "   查看 'Publishing status'："
echo "   - 'In production' = 已通过，所有用户可用 ✅"
echo "   - 'Testing' = 测试模式，只有 Test users 可用 ⚠️"
echo ""

# 检查网站可访问性
echo "3. 检查网站配置..."
DOMAIN="sora2aivideos.com"
echo "   首页: $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://$DOMAIN/)"
echo "   Privacy: $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://$DOMAIN/privacy)"
echo "   Terms: $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://$DOMAIN/terms)"
echo ""

echo "=== 检查完成 ==="
echo ""
echo "📋 下一步："
echo "   如果 Verification Center 显示绿色，可以测试实际登录功能"
```

### 实际登录测试：

1. **打开无痕窗口**（避免缓存干扰）

2. **访问登录页面**：
   ```
   https://sora2aivideos.com/login
   ```

3. **尝试 Google 登录**：
   - 如果 Google 登录按钮可用，点击测试
   - 如果成功登录 → ✅ 审核已通过
   - 如果显示 "access_denied" → ⚠️ 可能还在审核中或配置有问题

---

## 方法 3：使用 gcloud CLI 检查（需要配置，3 分钟）

### 在 Cloud Shell 中运行：

```bash
#!/bin/bash

echo "=== OAuth 审核状态检查 ==="
echo ""

# 设置项目
gcloud config set project skilled-acolyte-476516-g8

echo "1. 检查 OAuth Consent Screen 配置..."
echo "----------------------------------------"

# 尝试获取 OAuth consent screen 信息
CONSENT_INFO=$(gcloud alpha iap oauth-clients describe 2>/dev/null)

if [ -n "$CONSENT_INFO" ]; then
    echo "$CONSENT_INFO"
else
    echo "⚠️  无法通过 CLI 获取，请使用网页界面"
    echo ""
    echo "访问：https://console.cloud.google.com/apis/credentials/consent"
    echo ""
    echo "检查以下项："
    echo "  - Publishing status（发布状态）"
    echo "  - Verification Center（验证中心）"
fi

echo ""
echo "2. 检查 OAuth Client 配置..."
echo "----------------------------------------"

# 列出 OAuth 2.0 客户端
CLIENTS=$(gcloud alpha iap oauth-clients list 2>/dev/null)

if [ -n "$CLIENTS" ]; then
    echo "$CLIENTS"
else
    echo "⚠️  无法通过 CLI 获取，请使用网页界面"
    echo ""
    echo "访问：https://console.cloud.google.com/apis/credentials"
    echo "查看 OAuth 2.0 Client IDs"
fi

echo ""
echo "3. 快速网站检查..."
echo "----------------------------------------"
DOMAIN="sora2aivideos.com"

echo "检查网站可访问性："
for page in "/" "/privacy" "/terms"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://$DOMAIN$page 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ $page: OK"
    else
        echo "  ❌ $page: HTTP $STATUS"
    fi
done

echo ""
echo "=== 检查完成 ==="
```

---

## 🎯 最快速的检查方法（推荐）

### 一键检查脚本（复制到 Cloud Shell）：

```bash
echo "🔍 快速检查 OAuth 审核状态..."
echo ""
echo "1. Verification Center 状态："
echo "   访问：https://console.cloud.google.com/apis/credentials/consent"
echo "   点击：验证中心 → 查看'首页要求'状态"
echo ""
echo "2. Publishing Status："
echo "   在同一页面查看 'Publishing status'"
echo "   - 'In production' = ✅ 已通过"
echo "   - 'Testing' = ⚠️  测试模式"
echo ""
echo "3. 实际登录测试："
echo "   访问：https://sora2aivideos.com/login"
echo "   尝试使用 Google 登录"
echo ""
echo "4. 网站配置检查："
DOMAIN="sora2aivideos.com"
echo "   首页: $(curl -s -o /dev/null -w '%{http_code}' --max-time 3 https://$DOMAIN/ 2>/dev/null || echo '无法连接')"
echo "   Privacy: $(curl -s -o /dev/null -w '%{http_code}' --max-time 3 https://$DOMAIN/privacy 2>/dev/null || echo '无法连接')"
echo "   Terms: $(curl -s -o /dev/null -w '%{http_code}' --max-time 3 https://$DOMAIN/terms 2>/dev/null || echo '无法连接')"
echo ""
echo "✅ 如果 Verification Center 显示绿色，且网站返回 200，说明配置正确"
```

---

## 📊 审核状态判断表

| 状态 | Verification Center | Publishing Status | 实际登录 | 说明 |
|------|-------------------|-------------------|---------|------|
| ✅ **已通过** | 绿色 ✅ | In production | 成功 | 所有用户可用 |
| ⏳ **审核中** | 黄色 ⏳ | Testing 或 In production | 可能成功 | 等待最终审核 |
| ❌ **未通过** | 红色 ❌ | Testing | 失败 | 需要修复问题 |

---

## 🔍 详细检查清单

### 检查 1：Verification Center 状态

**访问**：https://console.cloud.google.com/apis/credentials/consent → 验证中心

**查看**：
- [ ] 隐私权政策要求：应该是 ✅ 绿色
- [ ] 品牌推广指南：应该是 ✅ 绿色
- [ ] **首页要求**：当前是什么状态？
  - ✅ 绿色 = 已通过
  - ⏳ 黄色 = 审核中
  - ❌ 红色 = 仍有问题

### 检查 2：Publishing Status

**在同一页面查看**：

- [ ] **Publishing status** 是什么？
  - "In production" = ✅ 已发布，所有用户可用
  - "Testing" = ⚠️ 测试模式，只有 Test users 可用

### 检查 3：OAuth Consent Screen 配置

**在同一页面 → 品牌塑造**：

- [ ] 应用隐私权政策链接：`https://sora2aivideos.com/privacy` ✅
- [ ] 应用服务条款链接：`https://sora2aivideos.com/terms` ✅
- [ ] 已获授权的网域包含：`sora2aivideos.com` ✅

### 检查 4：实际登录测试

1. **打开无痕窗口**
2. **访问**：https://sora2aivideos.com/login
3. **点击 Google 登录按钮**（如果可用）
4. **观察结果**：
   - ✅ 成功登录 → 审核已通过
   - ❌ 显示错误 → 可能还在审核中

---

## ⚡ 最快测试流程（1 分钟）

1. **打开浏览器**，访问：
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **点击左侧菜单**："验证中心"

3. **查看"首页要求"**：
   - 绿色 ✅ = 已通过，可以测试登录
   - 黄色 ⏳ = 审核中，等待即可
   - 红色 ❌ = 仍有问题，检查配置

4. **如果显示绿色或黄色**：
   - 在同一页面查看 "Publishing status"
   - 如果是 "In production"，可以测试实际登录

---

## 🎯 根据状态的操作

### 如果 Verification Center 显示 ✅ 绿色

**恭喜！审核已通过**

1. ✅ 检查 Publishing status 是否为 "In production"
2. ✅ 测试实际登录功能
3. ✅ 如果登录成功，说明一切正常

### 如果 Verification Center 显示 ⏳ 黄色

**审核正在进行中**

1. ⏳ 等待 24-48 小时
2. ⏳ 每 4-6 小时检查一次状态
3. ⏳ 通常会自动更新为绿色

### 如果 Verification Center 显示 ❌ 红色

**仍有问题需要修复**

1. ❌ 检查是否已修正 Privacy Policy 和 Terms 链接配置
2. ❌ 确认 Search Console 域名已验证
3. ❌ 如果已修复，等待 24-48 小时让系统更新
4. ❌ 如果 48 小时后仍显示红色，回复邮件或提交支持请求

---

## 💡 提示

- **最快的方法**：直接访问 Verification Center 查看状态（30 秒）
- **最准确的方法**：实际测试登录功能（2 分钟）
- **最全面的方法**：运行完整诊断脚本（5 分钟）

**推荐**：先用方法 1 快速检查，如果需要详细信息再用方法 2 或 3。
