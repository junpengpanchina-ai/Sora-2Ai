# 域名访问问题排查指南

## 🔴 错误信息

```
无法访问此网站
sora2aivideos.com 意外终止了连接。
ERR_CONNECTION_CLOSED
```

## 📋 可能的原因

### 1. Vercel 部署失败或未完成

**症状**: 网站完全无法访问

**检查步骤**:
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Deployments** 标签页
4. 检查最新部署的状态

**解决方案**:
- 如果部署失败，查看构建日志找出错误
- 如果部署正在进行，等待完成
- 如果所有部署都失败，需要修复构建错误

### 2. 域名配置问题

**症状**: 域名无法解析或连接被关闭

**检查步骤**:
1. 在 Vercel Dashboard 中，进入 **Settings** > **Domains**
2. 检查 `sora2aivideos.com` 是否已添加
3. 检查域名状态（应该是 **Valid** 或 **Valid Configuration**）

**解决方案**:
- 如果域名未添加，添加域名
- 如果域名配置错误，按照 Vercel 的指示更新 DNS 记录
- 等待 DNS 传播（可能需要几分钟到几小时）

### 3. DNS 配置问题

**症状**: 域名无法解析到 Vercel

**检查步骤**:
```bash
# 检查 DNS 记录
dig sora2aivideos.com
# 或
nslookup sora2aivideos.com
```

**应该看到的记录**:
- A 记录指向 Vercel 的 IP（如果使用 A 记录）
- CNAME 记录指向 `cname.vercel-dns.com`（推荐）

**解决方案**:
- 在域名注册商处配置 DNS 记录
- 如果使用 Vercel 的 DNS，确保配置正确
- 等待 DNS 传播

### 4. SSL/TLS 证书问题

**症状**: 连接在建立 SSL 握手时失败

**检查步骤**:
1. 在 Vercel Dashboard 中，进入 **Settings** > **Domains**
2. 检查 SSL 证书状态
3. 应该显示 "Valid Certificate" 或类似状态

**解决方案**:
- Vercel 会自动为域名配置 SSL 证书
- 如果证书未生成，等待几分钟
- 如果证书生成失败，检查域名配置

### 5. 构建错误导致没有可用部署

**症状**: 之前的构建都失败了

**检查步骤**:
1. 在 Vercel Dashboard 中，查看 **Deployments**
2. 检查是否有成功的部署
3. 查看构建日志

**解决方案**:
- 修复构建错误（如之前的 `flowType` 问题）
- 触发新的部署
- 确保至少有一个成功的部署

## 🔧 快速诊断步骤

### 步骤 1: 检查 Vercel 部署状态

1. 访问 https://vercel.com/dashboard
2. 找到你的项目
3. 检查 **Deployments** 标签页
4. 查看最新部署的状态：
   - ✅ **Ready**: 部署成功
   - ⏳ **Building**: 正在构建
   - ❌ **Error**: 构建失败
   - ⚠️ **Canceled**: 已取消

### 步骤 2: 检查域名配置

1. 在 Vercel Dashboard 中，进入 **Settings** > **Domains**
2. 检查域名列表
3. 确认 `sora2aivideos.com` 的状态：
   - **Valid**: 配置正确
   - **Invalid Configuration**: 需要更新 DNS
   - **Pending**: 等待配置生效

### 步骤 3: 测试 Vercel 默认域名

尝试访问 Vercel 提供的默认域名：
- 格式：`your-project.vercel.app`
- 如果默认域名可以访问，说明部署正常，问题在域名配置
- 如果默认域名也无法访问，说明部署有问题

### 步骤 4: 检查 DNS 记录

```bash
# 在终端运行（macOS/Linux）
dig sora2aivideos.com +short

# 或使用在线工具
# https://dnschecker.org/
```

**应该看到**:
- CNAME 记录指向 `cname.vercel-dns.com`
- 或 A 记录指向 Vercel 的 IP 地址

## 🛠️ 解决方案

### 方案 1: 修复构建错误并重新部署

如果构建失败（如之前的 `flowType` 错误）：

1. **修复代码错误**
2. **触发新部署**:
   - 在 Vercel Dashboard 中点击 **Redeploy**
   - 或推送新代码到 GitHub

### 方案 2: 配置域名

如果域名未配置：

1. **在 Vercel 中添加域名**:
   - 进入 **Settings** > **Domains**
   - 点击 **Add Domain**
   - 输入 `sora2aivideos.com`
   - 按照指示配置 DNS 记录

2. **在域名注册商处配置 DNS**:
   - 登录你的域名注册商（如 GoDaddy、Namecheap 等）
   - 找到 DNS 管理页面
   - 添加 CNAME 记录：
     ```
     类型: CNAME
     名称: @ (或留空，表示根域名)
     值: cname.vercel-dns.com
     ```
   - 或添加 A 记录（如果 Vercel 要求）

3. **等待 DNS 传播**:
   - 通常需要几分钟到几小时
   - 可以使用 https://dnschecker.org/ 检查全球 DNS 传播状态

### 方案 3: 使用 Vercel 默认域名临时访问

在域名配置完成前，可以使用 Vercel 的默认域名：

1. 在 Vercel Dashboard 中找到项目的默认域名
2. 格式通常是：`sora-2-ai.vercel.app` 或类似
3. 使用这个域名访问网站

## 🔍 详细检查清单

- [ ] Vercel 项目存在且状态正常
- [ ] 至少有一个成功的部署
- [ ] 域名已在 Vercel 中添加
- [ ] DNS 记录已正确配置
- [ ] DNS 记录已传播（使用 dnschecker.org 检查）
- [ ] SSL 证书已生成（Vercel 自动处理）
- [ ] 没有构建错误
- [ ] 项目设置中的环境变量已配置

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **Vercel Dashboard 截图**:
   - Deployments 页面
   - Domains 设置页面

2. **DNS 检查结果**:
   ```bash
   dig sora2aivideos.com
   ```

3. **构建日志**:
   - 从 Vercel Dashboard 复制最新的构建日志

4. **域名注册商信息**:
   - 使用的域名注册商
   - DNS 配置截图

## ✅ 验证成功

网站正常工作时应该：

1. ✅ 可以访问 `https://sora2aivideos.com`
2. ✅ 显示 SSL 证书（锁图标）
3. ✅ 页面正常加载
4. ✅ 没有重定向错误

## 🚀 快速修复命令

如果需要重新部署：

```bash
# 确保代码是最新的
git pull origin main

# 创建一个空提交触发部署
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

然后在 Vercel Dashboard 中等待新部署完成。

