# 执行迁移 134：重定向命中量统计表

## 📋 迁移内容

创建 `redirect_hit_daily_counts` 表，用于记录每天命中重定向 pattern 的次数。

## 🚀 执行方式

### 方式 1：通过 Supabase Dashboard（推荐）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制以下 SQL 并执行：

```sql
-- 134_redirect_hit_daily_counts.sql
-- 重定向命中量统计表：记录每天命中重定向 pattern 的次数
-- 用于 Index Gate 证据链：监控重定向 pattern 是否收敛

CREATE TABLE IF NOT EXISTS public.redirect_hit_daily_counts (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  pattern TEXT NOT NULL,              -- 重定向 pattern（如 'video_prompt_param', 'keywords_repeated_prefix'）
  hits INTEGER NOT NULL DEFAULT 0,    -- 当日命中次数
  sample_url TEXT,                    -- 示例 URL（用于调试）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, pattern)
);

CREATE INDEX IF NOT EXISTS redirect_hit_daily_counts_date_idx ON public.redirect_hit_daily_counts(date);
CREATE INDEX IF NOT EXISTS redirect_hit_daily_counts_pattern_idx ON public.redirect_hit_daily_counts(pattern);

-- 更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION public.tg_redirect_hit_daily_counts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS redirect_hit_daily_counts_set_updated_at ON public.redirect_hit_daily_counts;
CREATE TRIGGER redirect_hit_daily_counts_set_updated_at
  BEFORE UPDATE ON public.redirect_hit_daily_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_redirect_hit_daily_counts_updated_at();

COMMENT ON TABLE public.redirect_hit_daily_counts IS '重定向命中量统计：用于 Index Gate 监控，pattern hit 必须下降';
COMMENT ON COLUMN public.redirect_hit_daily_counts.pattern IS '重定向 pattern（如 video_prompt_param, keywords_repeated_prefix）';
COMMENT ON COLUMN public.redirect_hit_daily_counts.hits IS '当日命中次数';
COMMENT ON COLUMN public.redirect_hit_daily_counts.sample_url IS '示例 URL（用于调试）';

-- 初始化今日数据（如果不存在）
INSERT INTO public.redirect_hit_daily_counts (date, pattern, hits, sample_url)
VALUES 
  (CURRENT_DATE, 'video_prompt_param', 0, NULL),
  (CURRENT_DATE, 'keywords_repeated_prefix', 0, NULL)
ON CONFLICT (date, pattern) DO NOTHING;
```

5. 点击 **Run** 执行
6. 确认执行成功（应该看到 "Success. No rows returned"）

---

### 方式 2：使用 Supabase CLI（本地开发）

如果本地 Docker 已启动：

```bash
# 启动本地 Supabase（如果未启动）
supabase start

# 执行迁移
supabase migration up 134

# 或直接执行 SQL 文件
supabase db execute -f supabase/migrations/134_redirect_hit_daily_counts.sql
```

---

### 方式 3：使用 Supabase CLI（连接远程数据库）

```bash
# 链接到远程项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db push
```

---

## ✅ 验证迁移成功

执行以下 SQL 验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'redirect_hit_daily_counts';

-- 检查表结构
\d redirect_hit_daily_counts

-- 检查初始化数据
SELECT * FROM redirect_hit_daily_counts;
```

**预期结果**：
- 表 `redirect_hit_daily_counts` 存在
- 有 2 条初始化数据（`video_prompt_param` 和 `keywords_repeated_prefix`）

---

## 📝 后续步骤

迁移成功后：

1. ✅ Middleware 会自动记录重定向命中量
2. ✅ 可以通过 SQL 查询监控趋势：
   ```sql
   SELECT date, pattern, hits 
   FROM redirect_hit_daily_counts 
   ORDER BY date DESC, pattern;
   ```
3. ✅ 观察 3 天，确保 `video_prompt_param` 的 hits 下降

---

## 🚨 如果遇到错误

### 错误：relation "redirect_hit_daily_counts" already exists

**原因**：表已存在（可能是之前手动创建过）

**解决**：迁移使用 `CREATE TABLE IF NOT EXISTS`，可以安全地重新执行。

### 错误：permission denied

**原因**：没有足够的权限

**解决**：确保使用有足够权限的数据库用户（通常是 `postgres` 或 `service_role`）

---

## 📄 相关文件

- `supabase/migrations/134_redirect_hit_daily_counts.sql` - 迁移文件
- `middleware.ts` - 重定向逻辑（会写入此表）
- `lib/seo/bad-url-report.ts` - 坏 URL 打点（需要配置 endpoint）
