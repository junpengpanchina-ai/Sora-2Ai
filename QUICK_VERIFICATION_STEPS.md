# Google Search Console 快速验证步骤

## ✅ 验证文件已准备完成

文件已创建并已推送到代码库，Vercel 会自动部署。

## 🚀 快速验证方法

### 方法 1: 通过 Vercel 默认域名验证（推荐）

1. **获取 Vercel 默认域名**
   - 访问 https://vercel.com/dashboard
   - 选择你的项目
   - 查看项目详情页，会显示默认域名（格式：`sora-2ai-xxx.vercel.app`）
   - 或在 **Deployments** 标签页查看最新部署的 URL

2. **访问验证文件**
   - 访问：`https://[你的vercel域名]/googlec426b8975880cdb3.html`
   - 应该能看到文件内容：`google-site-verification: googlec426b8975880cdb3.html`

3. **在 Google Search Console 验证**
   - 返回 Google Search Console 验证页面
   - 如果支持修改验证 URL，改为 Vercel 的默认域名
   - 或者先添加 Vercel 域名作为新的属性，完成验证后再配置自定义域名

### 方法 2: 等待 DNS 配置完成

如果域名 DNS 已配置：

1. **等待 DNS 传播**（1-24 小时）
2. **访问验证文件**
   - `https://www.sora2ai.com/googlec426b8975880cdb3.html`
3. **完成验证**

## 📋 当前状态

- ✅ 验证文件已创建：`public/googlec426b8975880cdb3.html`
- ✅ 文件已提交到 Git
- ✅ 代码已推送到 GitHub
- ✅ Vercel 会自动部署（如果已连接）
- ⚠️ 域名 DNS 需要配置（如果需要使用自定义域名）

## ⚡ 下一步

1. **检查 Vercel 部署状态**
   - 确认项目已成功部署
   - 复制 Vercel 默认域名

2. **测试验证文件**
   - 通过 Vercel 默认域名访问验证文件
   - 确认文件内容正确

3. **完成 Google 验证**
   - 使用 Vercel 默认域名完成验证
   - 或等待 DNS 配置后使用自定义域名

---

**验证文件已就绪，部署后即可使用！** 🚀
