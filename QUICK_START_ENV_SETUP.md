# 快速启动：环境变量设置

## ⚠️ 需要设置环境变量

脚本需要以下环境变量才能运行：

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 设置方法

### 方法 1: 使用 .env.local 文件

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 方法 2: 临时设置（当前终端会话）

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 方法 3: 从 Supabase Dashboard 获取

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 注意：这是 secret key，不要提交到 Git）

## 验证环境变量

```bash
# 检查环境变量是否设置
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

## 设置完成后

继续执行：

```bash
# 1. 计算 AI Citation Score
npm run calculate:ai-scores:batch

# 2. 生成 Tier1 内链
npm run generate:tier1-links

# 3. 启动开发服务器
npm run dev
```

---

**注意**: `.env.local` 文件已在 `.gitignore` 中，不会被提交到 Git。
