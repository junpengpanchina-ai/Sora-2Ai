# DNS 解析问题修复指南 - www 子域名

## 🔴 问题描述

SEO 工具报告：`https://www.sora2aivideos.com/` 无法解析 DNS，导致页面无法被抓取。

## 📋 问题原因

1. **DNS 记录缺失**：`www.sora2aivideos.com` 子域名可能没有配置 DNS 记录
2. **Vercel 域名未添加**：`www` 子域名可能没有在 Vercel 中添加
3. **DNS 传播延迟**：如果刚配置，可能需要等待 DNS 传播

## ✅ 解决方案

### 方案 1: 在 Vercel 中添加 www 子域名（推荐）

1. **访问 Vercel Dashboard**
   - 登录 https://vercel.com/dashboard
   - 选择你的项目

2. **添加 www 子域名**
   - 进入 **Settings** > **Domains**
   - 点击 **Add Domain**
   - 输入：`www.sora2aivideos.com`
   - 点击 **Add**

3. **配置 DNS 记录**
   - Vercel 会显示需要配置的 DNS 记录
   - 通常需要添加 CNAME 记录：
     ```
     类型: CNAME
     名称: www
     值: cname.vercel-dns.com
     ```

4. **在域名注册商处配置**
   - 登录你的域名注册商（GoDaddy、Namecheap 等）
   - 进入 DNS 管理页面
   - 添加 CNAME 记录：
     - **名称**: `www`
     - **类型**: `CNAME`
     - **值**: `cname.vercel-dns.com`（或 Vercel 提供的值）
     - **TTL**: `3600`（或默认值）

5. **等待 DNS 传播**
   - 通常需要 5 分钟到 24 小时
   - 使用 https://dnschecker.org/ 检查全球 DNS 传播状态
   - 搜索：`www.sora2aivideos.com`

### 方案 2: 配置重定向（已实现）

我已经在 `middleware.ts` 中添加了自动重定向功能：

- 当用户访问 `www.sora2aivideos.com` 时
- 自动重定向到 `sora2aivideos.com`（非 www 版本）
- 使用 301 永久重定向（SEO 友好）

**注意**：重定向需要 DNS 能解析 `www` 子域名才能工作。如果 DNS 无法解析，重定向也无法执行。

### 方案 3: 使用 A 记录（如果 CNAME 不支持）

某些域名注册商可能不支持根域名的 CNAME 记录，可以使用 A 记录：

1. **获取 Vercel 的 IP 地址**
   - 在 Vercel Dashboard 的 Domains 设置中查看
   - 或联系 Vercel 支持获取

2. **配置 A 记录**
   ```
   类型: A
   名称: www
   值: [Vercel 提供的 IP 地址]
   TTL: 3600
   ```

## 🔍 验证步骤

### 1. 检查 DNS 记录

使用命令行工具检查：

```bash
# 检查 www 子域名的 DNS 记录
dig www.sora2aivideos.com
# 或
nslookup www.sora2aivideos.com
```

**应该看到**：
- CNAME 记录指向 `cname.vercel-dns.com`
- 或 A 记录指向 Vercel 的 IP 地址

### 2. 检查 DNS 传播

访问 https://dnschecker.org/：
1. 输入：`www.sora2aivideos.com`
2. 选择记录类型：`CNAME` 或 `A`
3. 检查全球各地的 DNS 解析状态

### 3. 测试访问

1. **直接访问**：
   - 访问 `https://www.sora2aivideos.com`
   - 应该自动重定向到 `https://sora2aivideos.com`

2. **检查重定向**：
   ```bash
   curl -I https://www.sora2aivideos.com
   ```
   应该看到：
   ```
   HTTP/1.1 301 Moved Permanently
   Location: https://sora2aivideos.com
   ```

### 4. 验证 SEO 工具

等待 24-48 小时后：
1. 重新运行 SEO 分析工具
2. 检查 DNS 解析问题是否已解决
3. 确认 `www.sora2aivideos.com` 可以正常访问

## 📝 常见问题

### Q: 为什么需要配置 www 子域名？

A: 有些用户习惯输入 `www.` 前缀，搜索引擎也会尝试抓取 `www` 版本。如果 DNS 无法解析，会导致抓取失败。

### Q: 重定向会影响 SEO 吗？

A: 不会。301 永久重定向是 SEO 友好的，会告诉搜索引擎：
- `www.sora2aivideos.com` 已永久移动到 `sora2aivideos.com`
- 搜索引擎会将排名和权重转移到新 URL

### Q: DNS 传播需要多长时间？

A: 通常：
- **最快**：5-15 分钟
- **一般**：1-4 小时
- **最慢**：24-48 小时（全球传播）

### Q: 如何加快 DNS 传播？

A: 
1. 使用较低的 TTL 值（如 300 秒）
2. 清除本地 DNS 缓存
3. 使用 Google DNS (8.8.8.8) 或 Cloudflare DNS (1.1.1.1)

## 🚀 快速检查清单

- [ ] 在 Vercel Dashboard 中添加了 `www.sora2aivideos.com` 域名
- [ ] 在域名注册商处配置了 CNAME 或 A 记录
- [ ] DNS 记录已传播（使用 dnschecker.org 验证）
- [ ] 可以访问 `https://www.sora2aivideos.com`（会重定向到非 www 版本）
- [ ] SEO 工具可以成功解析 DNS

## 📞 需要帮助？

如果问题仍然存在，请提供：

1. **DNS 检查结果**：
   ```bash
   dig www.sora2aivideos.com
   ```

2. **Vercel Dashboard 截图**：
   - Domains 设置页面
   - 显示域名状态

3. **域名注册商信息**：
   - 使用的注册商
   - DNS 配置截图
