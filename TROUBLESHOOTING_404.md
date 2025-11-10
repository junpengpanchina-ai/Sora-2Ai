# 解决 404 错误 - Next.js 静态资源无法加载

## 问题症状

访问页面时出现以下错误：
```
GET http://localhost:3000/_next/static/css/app/layout.css?v=... 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/main-app.js?v=... 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/app-pages-internals.js 404 (Not Found)
```

## 解决方案

### 方法 1: 清除缓存并重启（推荐）

1. **停止开发服务器**
   - 在运行 `npm run dev` 的终端按 `Ctrl+C`

2. **清除 Next.js 缓存**
   ```bash
   rm -rf .next
   ```

3. **重新启动开发服务器**
   ```bash
   npm run dev
   ```

### 方法 2: 完全清理并重新安装

如果方法 1 不起作用：

1. **停止开发服务器**

2. **清除所有缓存和构建文件**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **重新安装依赖（可选）**
   ```bash
   npm install
   ```

4. **重新启动**
   ```bash
   npm run dev
   ```

### 方法 3: 检查端口占用

如果 3000 端口被占用：

1. **查找占用 3000 端口的进程**
   ```bash
   lsof -ti:3000
   ```

2. **杀死进程（如果需要）**
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

3. **重新启动开发服务器**
   ```bash
   npm run dev
   ```

### 方法 4: 使用不同的端口

如果 3000 端口有问题，可以使用其他端口：

```bash
npm run dev -- -p 3001
```

然后访问 `http://localhost:3001`

## 常见原因

1. **构建缓存损坏** - `.next` 目录中的文件不完整或损坏
2. **开发服务器未正确启动** - Next.js 开发服务器需要完全启动才能提供静态资源
3. **端口冲突** - 3000 端口被其他应用占用
4. **文件系统问题** - 在某些情况下，文件系统监听可能有问题

## 验证修复

修复后，你应该能够：
- ✅ 正常访问 `http://localhost:3000`
- ✅ 正常访问 `http://localhost:3000/video`
- ✅ 浏览器控制台没有 404 错误
- ✅ 页面样式正常加载

## 如果问题仍然存在

1. **检查 Node.js 版本**
   ```bash
   node --version
   ```
   确保使用 Node.js 18+ 版本

2. **检查 Next.js 版本**
   ```bash
   npm list next
   ```

3. **查看完整错误日志**
   - 检查终端中的完整错误信息
   - 检查浏览器开发者工具的 Network 标签

4. **重新克隆项目**（最后手段）
   ```bash
   # 备份 .env.local 文件
   cp .env.local .env.local.backup
   
   # 删除项目并重新克隆
   # 然后恢复 .env.local
   ```



