# 手动应用数据库迁移

## 🎯 目标

应用 `060_create_page_scores_table.sql` 迁移，创建 `page_scores` 表。

## ✅ 方法 1: 通过 Supabase Dashboard（推荐）

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 选择项目：`hgzpzsiafycwlqrkzbis`

2. **进入 SQL Editor**
   - 点击左侧菜单 **SQL Editor**
   - 点击 **New query**

3. **执行迁移 SQL**
   - 复制 `./supabase/migrations/060_create_page_scores_table.sql` 的内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

4. **验证**
   - 在 **Table Editor** 中应该能看到 `page_scores` 表

---

## ✅ 方法 2: 通过 Supabase CLI（如果已连接）

```bash
# 如果本地和远程不同步，先拉取远程状态
supabase db pull

# 然后推送迁移
supabase db push
```

---

## ✅ 方法 3: 直接执行 SQL（最简单）

**在 Supabase Dashboard → SQL Editor 中执行**：

```sql
-- 创建 page_scores 表用于存储 AI Citation Score
CREATE TABLE IF NOT EXISTS page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  tier INTEGER NOT NULL DEFAULT 3,
  ai_citation_score INTEGER NOT NULL DEFAULT 0,
  recalc_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signals JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_scores_url ON page_scores(url);
CREATE INDEX IF NOT EXISTS idx_page_scores_tier ON page_scores(tier);
CREATE INDEX IF NOT EXISTS idx_page_scores_score ON page_scores(ai_citation_score DESC);
CREATE INDEX IF NOT EXISTS idx_page_scores_recalc_at ON page_scores(recalc_at);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_page_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_page_scores_updated_at
  BEFORE UPDATE ON page_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_page_scores_updated_at();
```

---

## ✅ 验证迁移成功

在 Supabase Dashboard → Table Editor 中：
- 应该能看到 `page_scores` 表
- 表结构应该包含：id, url, tier, ai_citation_score, recalc_at, signals, created_at, updated_at
