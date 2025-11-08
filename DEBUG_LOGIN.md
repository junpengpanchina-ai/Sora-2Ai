# 登录调试指南

## ✅ 已确认配置

- [x] Google Cloud Console 重定向 URI 已配置
  - `http://localhost:3000/auth/callback`
  - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`

## 🔍 调试步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看：

#### Console 标签页
- 是否有红色错误信息？
- 是否有警告信息？
- 复制所有错误信息

#### Network 标签页
1. 点击登录按钮
2. 查看网络请求：
   - 查找 `/auth/callback` 请求
   - 查看请求状态码（200, 302, 404, 500等）
   - 查看请求和响应内容

### 2. 检查开发服务器日志

查看运行 `npm run dev` 的终端窗口：
- 是否有错误信息？
- 是否有警告信息？
- 复制所有相关日志

### 3. 测试流程检查

请告诉我：

1. **点击登录按钮后发生了什么？**
   - [ ] 没有任何反应
   - [ ] 跳转到 Google 授权页面
   - [ ] 显示错误信息
   - [ ] 其他：___________

2. **如果跳转到 Google 授权页面：**
   - [ ] 授权后能返回应用
   - [ ] 授权后显示错误
   - [ ] 授权后停留在空白页面
   - [ ] 其他：___________

3. **当前显示的错误信息是什么？**
   - 登录页面显示的错误：___________
   - 浏览器控制台的错误：___________

### 4. 常见问题检查

#### 问题 A: Supabase Provider 配置

请确认：
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **Authentication** > **Providers**
4. 确认 **Google** provider：
   - [ ] 开关已打开（启用）
   - [ ] Client ID 正确：`222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - [ ] Client Secret 正确：`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`
   - [ ] 已点击 **Save**

#### 问题 B: 环境变量

运行检查：
```bash
npm run check-env
```

应该显示所有变量已配置。

#### 问题 C: 清除浏览器缓存

尝试：
1. 清除浏览器缓存和 Cookie
2. 或使用隐私模式（无痕模式）测试
3. 重新访问 `http://localhost:3000`

### 5. 手动测试 Supabase 连接

```bash
npm run test:supabase
```

应该显示所有测试通过。

## 📋 需要的信息

请提供以下信息以便进一步调试：

1. **浏览器控制台的完整错误信息**（Console 标签页）
2. **Network 标签页中的相关请求**（特别是 `/auth/callback` 请求）
3. **开发服务器的终端输出**（错误和警告）
4. **具体的行为描述**（点击登录后发生了什么）

## 🔧 快速修复尝试

### 尝试 1: 重启开发服务器

```bash
# 停止服务器 (Ctrl+C)
# 清理缓存
rm -rf .next
# 重新启动
npm run dev
```

### 尝试 2: 检查 Supabase 项目状态

1. 访问 Supabase Dashboard
2. 确认项目状态为 "Active"
3. 检查是否有任何警告或错误提示

### 尝试 3: 验证 Supabase Auth 配置

在 Supabase Dashboard 中：
1. **Authentication** > **URL Configuration**
2. 确认 **Site URL** 设置为：`http://localhost:3000`
3. 确认 **Redirect URLs** 包含：`http://localhost:3000/**`

## 💡 提示

如果问题仍然存在，请：
1. 截图浏览器控制台的错误信息
2. 截图 Network 标签页的相关请求
3. 复制开发服务器的错误日志

这些信息将帮助快速定位问题。

