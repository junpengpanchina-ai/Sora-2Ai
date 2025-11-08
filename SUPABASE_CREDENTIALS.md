# Supabase 凭据信息

## 项目信息

- **项目名称**: Sora AI Platform
- **项目 ID**: hgzpzsiafycwlqrkzbis
- **数据库密码**: peng000000

## API 凭据

### Project URL
```
https://hgzpzsiafycwlqrkzbis.supabase.co
```

### Anon Key (已提供)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q
```

### Service Role Key (需要获取)

⚠️ **需要从 Supabase Dashboard 获取**：
1. 进入 **Settings** > **API**
2. 找到 **service_role** key
3. 点击 **Reveal** 显示
4. 复制并添加到 `.env.local`

## 环境变量配置

请在 `.env.local` 文件中添加：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 下一步

1. 获取 Service Role Key（从 Supabase Dashboard）
2. 创建 `.env.local` 文件并填入上述配置
3. 执行数据库迁移
4. 配置 Google OAuth Provider
5. 测试连接

