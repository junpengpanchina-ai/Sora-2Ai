# 域名配置指南 - sora2ai.com

## 🔴 当前问题

访问 `https://www.sora2ai.com/googlec426b8975880cdb3.html` 时看到 Namecheap 占位页面，说明域名还没有正确配置到 Vercel。

## ✅ 解决步骤

### 步骤 1: 在 Vercel 中添加域名

1. **访问 Vercel Dashboard**
   - 登录 https://vercel.com/dashboard
   - 选择你的项目

2. **进入项目设置**
   - 点击项目名称进入项目详情
   - 点击顶部菜单的 **Settings**
   - 在左侧菜单选择 **Domains**

3. **添加域名**
   - 点击 **Add Domain** 按钮
   - 输入 `sora2ai.com`
   - 点击 **Add**
   - 再添加 `www.sora2ai.com`（带 www 的版本）

### 步骤 2: 配置 DNS 记录（在 Namecheap）

Vercel 会显示需要配置的 DNS 记录。通常需要：

#### 选项 A: 使用 A 记录（推荐）

在 Namecheap 的 DNS 管理中添加：

```
类型: A Record
主机: @
值: 76.76.21.21
TTL: Automatic (或 3600)
```

对于 www 子域名：
```
类型: CNAME Record
主机: www
值: cname.vercel-dns.com
TTL: Automatic (或 3600)
```

#### 选项 B: 使用 CNAME（如果支持）

```
类型: CNAME Record
主机: @
值: cname.vercel-dns.com
TTL: Automatic (或 3600)
```

**注意**: 不是所有域名注册商都支持根域名的 CNAME，如果不行就用选项 A。

### 步骤 3: 在 Namecheap 配置 DNS

1. **登录 Namecheap**
   - 访问 https://www.namecheap.com
   - 登录你的账户

2. **进入域名管理**
   - 点击 **Domain List**
   - 找到 `sora2ai.com`
   - 点击 **Manage**

3. **配置 DNS**
   - 选择 **Advanced DNS** 标签
   - 删除现有的 A 记录（如果有）
   - 添加新的 A 记录：
     - **Type**: A Record
     - **Host**: @
     - **Value**: 76.76.21.21（或 Vercel 提供的 IP）
     - **TTL**: Automatic
   - 添加 CNAME 记录（www）：
     - **Type**: CNAME Record
     - **Host**: www
     - **Value**: cname.vercel-dns.com
     - **TTL**: Automatic

4. **保存更改**
   - 点击 **Save All Changes**

### 步骤 4: 等待 DNS 传播

DNS 更改通常需要：
- **最快**: 几分钟
- **通常**: 1-24 小时
- **最长**: 48 小时

### 步骤 5: 验证 DNS 配置

使用以下命令检查 DNS 是否已更新：

```bash
# 检查 A 记录
dig sora2ai.com +short

# 检查 www CNAME
dig www.sora2ai.com +short

# 或使用在线工具
# https://dnschecker.org/
```

### 步骤 6: 在 Vercel 验证域名

1. 返回 Vercel Dashboard
2. 在 **Domains** 页面，等待域名状态变为 **Valid**
3. 如果显示错误，点击 **Retry** 或查看错误信息

### 步骤 7: 配置 SSL 证书

Vercel 会自动为你的域名配置 SSL 证书（Let's Encrypt），通常需要几分钟。

## 🔍 验证步骤

### 1. 检查域名是否指向 Vercel

部署后，访问：
- `https://sora2ai.com` - 应该显示你的网站（不是 Namecheap 页面）
- `https://www.sora2ai.com` - 应该显示你的网站
- `https://www.sora2ai.com/googlec426b8975880cdb3.html` - 应该显示验证文件内容

### 2. 检查验证文件

访问验证文件 URL，应该看到：
```
google-site-verification: googlec426b8975880cdb3.html
```

而不是 Namecheap 的占位页面。

## ⚠️ 常见问题

### 问题 1: DNS 传播慢

**解决方案**:
- 等待 24-48 小时
- 清除本地 DNS 缓存：
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  
  # Windows
  ipconfig /flushdns
  ```

### 问题 2: Vercel 显示域名无效

**检查**:
1. DNS 记录是否正确配置
2. TTL 是否设置正确
3. 是否等待了足够的时间让 DNS 传播

### 问题 3: SSL 证书未生成

**解决方案**:
- 等待 5-10 分钟
- 在 Vercel Dashboard 的 Domains 页面点击 **Refresh**
- 确保 DNS 已正确配置

## 📝 快速检查清单

- [ ] 在 Vercel 中添加了 `sora2ai.com` 和 `www.sora2ai.com`
- [ ] 在 Namecheap 配置了 A 记录指向 Vercel IP
- [ ] 在 Namecheap 配置了 CNAME 记录（www）
- [ ] 等待 DNS 传播（1-24 小时）
- [ ] 验证文件已部署到 `public/googlec426b8975880cdb3.html`
- [ ] 代码已推送到 Git 并部署到 Vercel
- [ ] 访问 `https://www.sora2ai.com` 显示你的网站（不是 Namecheap 页面）
- [ ] 访问验证文件 URL 可以正常访问

## 🎯 完成后的下一步

域名配置完成后：

1. **验证 Google Search Console**
   - 访问验证文件 URL 确认可以访问
   - 在 Google Search Console 点击"验证"

2. **提交 Sitemap**
   - 在 Google Search Console 提交 `https://www.sora2ai.com/sitemap.xml`

3. **监控索引状态**
   - 定期检查 Google Search Console 的索引状态

---

**重要提示**: 如果域名还在 Namecheap 的占位页面，说明 DNS 还没有正确配置或还没有传播完成。请按照上述步骤配置 DNS，然后等待传播。
