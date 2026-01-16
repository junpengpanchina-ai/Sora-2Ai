# 应用数据库迁移 061

## 步骤 1: 在 Supabase Dashboard 执行 SQL

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 复制以下 SQL 内容并粘贴：

```sql
-- 创建 Tier1 内链、Index Health 周报、AI SERP 监控相关表

-- 1) 存 Tier1 内链结果（每页若干 outbound links）
CREATE TABLE IF NOT EXISTS page_internal_links (
  page_id UUID NOT NULL, -- use_cases.id
  target_page_id UUID NOT NULL, -- use_cases.id
  anchor_text TEXT,
  bucket TEXT NOT NULL, -- 'same_industry' | 'same_scene' | 'same_platform' | 'explore'
  weight INTEGER DEFAULT 1,
  week_key TEXT NOT NULL, -- e.g. '2026-W03' 用于慢轮换
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (page_id, target_page_id, week_key)
);

CREATE INDEX IF NOT EXISTS idx_page_internal_links_page_week ON page_internal_links(page_id, week_key);
CREATE INDEX IF NOT EXISTS idx_page_internal_links_week ON page_internal_links(week_key);
CREATE INDEX IF NOT EXISTS idx_page_internal_links_bucket ON page_internal_links(bucket);

COMMENT ON TABLE page_internal_links IS '存储 Tier1 页面的内链关系（每周轮换）';
COMMENT ON COLUMN page_internal_links.bucket IS '链接类型：same_industry/same_scene/same_platform/explore';
COMMENT ON COLUMN page_internal_links.week_key IS '周标识符，格式：YYYY-WNN，用于每周轮换';

-- 2) 周报快照（JSON）
CREATE TABLE IF NOT EXISTS index_health_reports (
  week_key TEXT PRIMARY KEY, -- e.g. '2026-W03'
  report_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_index_health_reports_created ON index_health_reports(created_at DESC);

COMMENT ON TABLE index_health_reports IS '存储每周的 Index Health 周报快照（JSON 格式）';

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_index_health_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_index_health_reports_updated_at
  BEFORE UPDATE ON index_health_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_index_health_reports_updated_at();

-- 3) AI Citation / AIO 监控结果（抽样 SERP）
CREATE TABLE IF NOT EXISTS ai_serp_checks (
  id BIGSERIAL PRIMARY KEY,
  page_id UUID, -- use_cases.id
  url TEXT NOT NULL,
  query TEXT NOT NULL,
  engine TEXT NOT NULL DEFAULT 'google',
  has_ai_overview BOOLEAN,
  cited BOOLEAN,
  position INTEGER,
  raw JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_serp_checks_week ON ai_serp_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_ai_serp_checks_page ON ai_serp_checks(page_id);
CREATE INDEX IF NOT EXISTS idx_ai_serp_checks_cited ON ai_serp_checks(cited) WHERE cited = true;

COMMENT ON TABLE ai_serp_checks IS '存储 AI Overview / Citation 的 SERP 监控结果';
COMMENT ON COLUMN ai_serp_checks.has_ai_overview IS '是否出现 AI Overview';
COMMENT ON COLUMN ai_serp_checks.cited IS '是否被引用（域名出现在结果中）';
COMMENT ON COLUMN ai_serp_checks.position IS '在搜索结果中的位置（如果被引用）';
```

6. 点击 **Run** 执行
7. 确认看到 "Success" 消息

---

## 验证迁移

执行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('page_internal_links', 'index_health_reports', 'ai_serp_checks');
```

应该返回 3 行。

---

## 下一步

迁移完成后，继续执行：
1. `npm run generate:tier1-links` - 生成内链
2. 在页面中添加 `<RelatedTier1Links />` 组件
3. 访问 `/index-health` 查看周报
