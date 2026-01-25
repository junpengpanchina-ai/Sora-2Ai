# Phase 2 Analytics - 转化漏斗埋点

## 核心事件（6 个）

| 事件名 | 触发时机 | 重要性 |
|--------|----------|--------|
| `hero_generate_click` | Hero 点 Generate | 首屏转化 |
| `example_click` | 点 Example 卡 | 学习成本 |
| `video_page_enter` | 进 /video | 意图确认 |
| `generation_started` | 调 API | 使用开始 |
| `generation_success` | 成功 | 产品价值 |
| `pricing_click` | 看价格 | 付费意图 |

---

## 每日只看 3 条漏斗

```
hero_generate_click → generation_started    # 首屏到实际生成
generation_started → generation_success     # 成功率
generation_success → pricing_click          # 付费意图
```

**任何一段掉得离谱，问题就在那里。**

---

## SQL 查询示例

### 1. 创建 events 表

```sql
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  user_id uuid references auth.users(id),
  meta jsonb,
  created_at timestamptz default now()
);

-- 索引
create index idx_events_name on events(name);
create index idx_events_created_at on events(created_at);
```

### 2. 每日漏斗查询

```sql
-- 今日各事件数量
select 
  name,
  count(*) as count
from events
where created_at >= current_date
group by name
order by count desc;
```

### 3. 转化率计算

```sql
-- 首屏转化率
with hero_clicks as (
  select count(*) as cnt from events 
  where name = 'hero_generate_click' 
  and created_at >= current_date
),
gen_started as (
  select count(*) as cnt from events 
  where name = 'generation_started' 
  and created_at >= current_date
)
select 
  hero_clicks.cnt as hero_clicks,
  gen_started.cnt as gen_started,
  round(gen_started.cnt::numeric / nullif(hero_clicks.cnt, 0) * 100, 1) as conversion_rate
from hero_clicks, gen_started;
```

### 4. 成功后付费意图

```sql
-- 生成成功后 5 分钟内点击 Pricing 的用户
with success_users as (
  select distinct user_id, created_at as success_at
  from events
  where name = 'generation_success'
  and created_at >= current_date
),
pricing_after_success as (
  select 
    e.user_id,
    s.success_at,
    e.created_at as pricing_at
  from events e
  join success_users s on e.user_id = s.user_id
  where e.name = 'pricing_click'
  and e.created_at > s.success_at
  and e.created_at <= s.success_at + interval '5 minutes'
)
select 
  (select count(distinct user_id) from success_users) as success_users,
  count(distinct user_id) as clicked_pricing,
  round(count(distinct user_id)::numeric / 
    nullif((select count(distinct user_id) from success_users), 0) * 100, 1) as intent_rate
from pricing_after_success;
```

---

## 前端埋点使用

```typescript
import { Events } from '@/lib/analytics/events'

// Hero Generate 按钮
Events.heroGenerateClick(userId, prompt)

// Example 卡片点击
Events.exampleClick(userId, 'Cyberpunk rain street')

// 进入 /video 页
Events.videoPageEnter(userId, fromHero)

// 开始生成
Events.generationStarted(userId, 'sora-2')

// 生成成功
Events.generationSuccess(userId, 'sora-2', 45000)

// 点击 Pricing
Events.pricingClick(userId, 'hero')
```

---

## Phase 2 成功标志

✅ 用户第一次生成 **不问"钱会不会退"**
✅ 有人生成成功后 **立刻点 Pricing**
✅ 有用户 **第一次成功生成后当天充值**

---

## 暂不启用 Supabase 埋点

当前 `ENABLE_SUPABASE_EVENTS = false`，所有事件只打印到 console。

需要启用时：
1. 在 Supabase 执行上述 SQL 创建表
2. 修改 `lib/analytics/events.ts` 中 `ENABLE_SUPABASE_EVENTS = true`
