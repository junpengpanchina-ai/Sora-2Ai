# 开发服务器无响应问题解决

## 问题症状

运行 `npm run dev` 后：
- 没有输出或输出很慢
- 卡在某个步骤
- 端口被占用
- 多个进程同时运行

## 🔧 快速解决方案

### 方法 1: 一键清理并重启（推荐）

```bash
npm run dev:kill
```

这个命令会：
1. 停止所有 Next.js 相关进程
2. 释放 3000 端口
3. 清理构建缓存
4. 重新启动开发服务器

### 方法 2: 分步操作

```bash
# 1. 停止所有进程
npm run kill

# 2. 清理构建缓存
npm run clean

# 3. 重新启动
npm run dev
```

### 方法 3: 手动清理

```bash
# 1. 停止所有 Next.js 进程
pkill -f "next-server"
pkill -f "next dev"

# 2. 释放 3000 端口
lsof -ti:3000 | xargs kill -9

# 3. 清理构建缓存
rm -rf .next
rm -rf node_modules/.cache

# 4. 重新启动
npm run dev
```

## 🐛 常见原因

### 1. 多个进程同时运行
- **症状**: 端口被占用，服务器无法启动
- **解决**: 使用 `npm run kill` 停止所有进程

### 2. 构建缓存损坏
- **症状**: 编译卡住，没有响应
- **解决**: 运行 `npm run clean` 清理缓存

### 3. 文件系统监听问题
- **症状**: 修改文件后没有热重载
- **解决**: 已在 `next.config.js` 中配置了 polling 模式

### 4. 内存不足
- **症状**: 进程卡住，系统变慢
- **解决**: 关闭其他应用，释放内存

### 5. 端口被其他应用占用
- **症状**: 无法绑定 3000 端口
- **解决**: 使用不同端口 `npm run dev -- -p 3001`

## 📋 检查清单

在启动开发服务器前：

- [ ] 没有其他 Next.js 进程在运行
- [ ] 3000 端口没有被占用
- [ ] `.env.local` 文件已正确配置
- [ ] 有足够的内存和磁盘空间
- [ ] Node.js 版本正确（18+）

## 🚀 优化启动速度

### 1. 使用 Turbo（可选）

如果项目很大，可以考虑使用 Turbo：

```bash
npm install -D turbo
```

### 2. 减少初始编译

- 只导入需要的模块
- 避免在顶层导入大型库
- 使用动态导入（`dynamic import`）

### 3. 检查依赖

```bash
# 检查是否有过时的依赖
npm outdated

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 💡 最佳实践

1. **每次启动前检查进程**
   ```bash
   ps aux | grep next
   ```

2. **使用清理脚本**
   - 遇到问题时先运行 `npm run kill`
   - 然后运行 `npm run clean`

3. **监控资源使用**
   - 如果系统变慢，检查内存和 CPU 使用
   - 关闭不必要的应用

4. **使用不同的端口**
   - 如果 3000 端口有问题，使用 3001 或其他端口

## 🔍 调试技巧

### 查看详细日志

```bash
# 启用详细日志
NODE_OPTIONS='--trace-warnings' npm run dev

# 或者
DEBUG=* npm run dev
```

### 检查端口占用

```bash
# 查看 3000 端口
lsof -i:3000

# 查看所有 Node.js 进程
ps aux | grep node
```

### 检查构建时间

在 `next.config.js` 中可以看到编译时间，如果某个页面编译很慢，可能是：
- 导入的模块太大
- 有循环依赖
- TypeScript 类型检查慢

## ⚠️ 如果仍然无响应

1. **完全重启**
   - 关闭所有终端
   - 重启电脑（最后手段）

2. **检查系统资源**
   ```bash
   # 查看内存使用
   top
   
   # 查看磁盘空间
   df -h
   ```

3. **重新安装依赖**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **检查 Node.js 版本**
   ```bash
   node --version  # 应该是 18.x 或更高
   ```

## 📚 相关命令

- `npm run kill` - 停止所有 Next.js 进程
- `npm run clean` - 清理构建缓存
- `npm run dev:kill` - 清理并重启（推荐）
- `npm run dev:clean` - 清理缓存后启动


