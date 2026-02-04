# 社交分享与 Share-Unlock 完整实现文档

## 📋 目录

1. [功能概述](#功能概述)
2. [数据库结构](#数据库结构)
3. [API 接口](#api-接口)
4. [前端集成](#前端集成)
5. [埋点与追踪](#埋点与追踪)
6. [部署检查清单](#部署检查清单)

---

## 功能概述

### 核心功能

1. **社交分享**：支持将视频生成结果分享到 Twitter/X、Facebook、Instagram（复制链接）、Copy link
2. **Share-Unlock**：用户分享后可领取本条视频一次「去水印导出」权益
3. **干净分享 URL**：使用 `/share/<taskId>` 而非当前页 URL，便于传播与 SEO

### 权限与限额

| 规则 | 说明 |
|------|------|
| **归属判定** | `video_tasks.user_id` = 当前登录用户 |
| **时间窗口** | 仅 `completed_at` 后 **10 分钟内**可领取 share-unlock |
| **每日限额** | 每人每日最多 **3 次**（`SHARE_UNLOCK_DAILY_LIMIT` 可配） |
| **每视频限额** | 每条视频最多领 **1 次**（幂等：已领取且未过期直接返回 200） |

---

## 数据库结构

### Migration 1: Share-Unlock 字段

**文件**：`supabase/migrations/131_share_unlock_video_tasks.sql`

```sql
ALTER TABLE video_tasks
  ADD COLUMN IF NOT EXISTS share_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_unlocked_by UUID,
  ADD COLUMN IF NOT EXISTS share_unlock_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS share_unlock_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_video_tasks_share_unlocked_by_at
  ON video_tasks(share_unlocked_by, share_unlocked_at)
  WHERE share_unlocked_at IS NOT NULL;
```

**字段说明**：

- `share_unlocked_at`：领取时间（用于判断是否已领取）
- `share_unlocked_by`：领取用户 ID（用于归属与每日限额统计）
- `share_unlock_used`：是否已使用（下载后置为 true，一次性）
- `share_unlock_expires_at`：过期时间（`share_unlocked_at + 10 分钟`）

### Migration 2: 每日限额表 + RPC

**文件**：`supabase/migrations/132_share_unlock_daily_counts.sql`

```sql
-- 每日限额计数表（风格对齐 bad_url_daily_counts）
CREATE TABLE IF NOT EXISTS share_unlock_daily_counts (
  day DATE NOT NULL,
  user_id UUID NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  last_task_id UUID NULL,
  last_platform TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (day, user_id)
);

CREATE INDEX IF NOT EXISTS share_unlock_daily_counts_day_idx
  ON share_unlock_daily_counts(day);

CREATE INDEX IF NOT EXISTS share_unlock_daily_counts_user_idx
  ON share_unlock_daily_counts(user_id);

ALTER TABLE share_unlock_daily_counts DISABLE ROW LEVEL SECURITY;

-- 原子限流 RPC：仅在低于限额时自增
CREATE OR REPLACE FUNCTION rpc_share_unlock_allow(
  p_user_id UUID,
  p_day DATE,
  p_limit INT,
  p_task_id UUID DEFAULT NULL,
  p_platform TEXT DEFAULT NULL
) RETURNS TABLE(allowed BOOLEAN, hits INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits INT;
BEGIN
  SELECT s.hits INTO v_hits
  FROM share_unlock_daily_counts s
  WHERE s.day = p_day AND s.user_id = p_user_id
  FOR UPDATE;

  IF v_hits IS NULL THEN
    INSERT INTO share_unlock_daily_counts(day, user_id, hits, last_task_id, last_platform, updated_at)
    VALUES (p_day, p_user_id, 1, p_task_id, p_platform, NOW());
    allowed := TRUE;
    hits := 1;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_hits >= p_limit THEN
    allowed := FALSE;
    hits := v_hits;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE share_unlock_daily_counts
  SET hits = hits + 1,
      last_task_id = COALESCE(p_task_id, last_task_id),
      last_platform = COALESCE(p_platform, last_platform),
      updated_at = NOW()
  WHERE day = p_day AND user_id = p_user_id
  RETURNING share_unlock_daily_counts.hits INTO v_hits;

  allowed := TRUE;
  hits := v_hits;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_share_unlock_allow(UUID, DATE, INT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_share_unlock_allow(UUID, DATE, INT, UUID, TEXT) TO service_role;
```

---

## API 接口

### 1. POST `/api/video/share-unlock/[taskId]`

**功能**：领取 share-unlock 权益

**请求**：
- Header：`Authorization: Bearer <token>`（必需）
- Header：`x-share-platform: twitter|facebook|instagram|copy`（可选，用于统计）

**响应**：

```typescript
// 成功（首次领取）
{
  unlocked: true,
  mode: 'share',
  expiresAt: '2026-02-03T12:30:00.000Z',
  dailyLimit: 3,
  hits: 1
}

// 成功（已付费，无需 unlock）
{
  unlocked: true,
  mode: 'paid',
  expiresAt: null
}

// 成功（幂等：已领取且未过期）
{
  unlocked: true,
  mode: 'share',
  alreadyClaimed: true,
  expiresAt: '2026-02-03T12:30:00.000Z'
}

// 错误
{ error: 'Daily limit reached', dailyLimit: 3, hits: 3 } // 429
{ error: 'Share unlock expired (claim within 10 minutes of completion)' } // 410
{ error: 'Unauthorized, please login first' } // 401
{ error: 'Task not found' } // 404
```

**实现要点**：

- 归属校验：`video_tasks.user_id === 当前用户`
- 时间窗口：**必须基于 `completed_at`**（用户心智完成点），未完成（`completed_at` 为空）返回 409
- 每日限额：调用 `rpc_share_unlock_allow`（原子自增）
- 幂等：已领取且未过期直接返回，不消耗限额

**文件**：`app/api/video/share-unlock/[taskId]/route.ts`

---

### 2. GET `/api/video/download-nowm/[taskId]`

**功能**：去水印下载（付费或 share-unlock）

**请求**：
- Header：`Authorization: Bearer <token>`（必需）

**响应**：

- **200**：流式返回视频文件（`Content-Type: video/mp4`，`Content-Disposition: attachment`）
- **403**：未解锁去水印权益
- **404**：任务不存在或视频 URL 不可用

**权限逻辑**：

```typescript
const allowedByPaid = task.remove_watermark === true
const allowedByShare =
  task.share_unlocked_at &&
  task.share_unlocked_by === userId &&
  task.share_unlock_used === false &&
  now <= task.share_unlock_expires_at

if (!allowedByPaid && !allowedByShare) {
  return 403 // No-watermark export not unlocked
}
```

**一次性消费**：

- 若通过 share-unlock 路径（非付费），下载成功后置 `share_unlock_used = true`
- **埋点区分**：前端根据 `allowedByPaid` vs `allowedByShare` 分别调用 `Events.downloadNoWatermarkPaid` 或 `Events.downloadNoWatermarkViaShare`（用于计算替代率）

**文件**：`app/api/video/download-nowm/[taskId]/route.ts`

**注意**：当前无水印文件与预览共用 `video_tasks.video_url`（无单独 `no_watermark_url` 字段）

---

### 3. GET `/share/[taskId]`

**功能**：分享页（干净 URL，带 OG tags）

**实现**：
- Server Component：`app/share/[taskId]/page.tsx`
- 查询 `video_tasks`（仅 `status === 'succeeded'`）
- **软防滥用**：未来可扩展 `deleted_at IS NULL` 或 `visibility = 'public'`（当前仅检查 status）
- **generateMetadata**：设置 `title`（prompt）、`description`、`canonical`、`openGraph`（含 `image`/`video`）、`twitter: card`
- `robots: { index: true, follow: true }`

**URL 生成**：

```typescript
import { getSharePageUrl } from '@/lib/utils/url'

const shareUrl = getSharePageUrl(taskId) // https://sora2aivideos.com/share/<taskId>
```

---

## 前端集成

### 组件：`SocialShareButtons`

**文件**：`components/SocialShareButtons.tsx`

**Props**：

```typescript
interface SocialShareButtonsProps {
  url: string                    // 分享 URL（建议 getSharePageUrl(taskId)）
  title?: string                 // 推文/分享文案（自动截断至 80 字符）
  size?: 'sm' | 'md' | 'lg'      // 按钮尺寸
  platforms?: SharePlatform[]    // ['twitter', 'facebook', 'copy', 'instagram']
  onShare?: (platform: SharePlatform) => void  // 分享回调（埋点 + unlock）
}
```

**平台行为**：

| 平台 | 行为 | Toast |
|------|------|-------|
| **Twitter/X** | 打开 `twitter.com/intent/tweet?text=...&url=...` | - |
| **Facebook** | 打开 `facebook.com/sharer/sharer.php?u=...` | - |
| **Copy link** | 复制 URL 到剪贴板 | `Link copied!` |
| **Instagram** | 复制 URL（无 web intent） | `Link copied — paste it into Instagram bio/story` |

---

### 视频结果页集成

**文件**：`app/video/VideoPageClient.tsx`

**状态管理**：

```typescript
const [shareUnlockedTaskId, setShareUnlockedTaskId] = useState<string | null>(null)
```

**分享回调（含 unlock）**：

```typescript
onShare={async (platform) => {
  setDidDownloadOrShare(true)
  Events.shareClick(userId, platform, currentResult.task_id)
  
  // 领取 share-unlock
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`/api/video/share-unlock/${currentResult.task_id}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'x-share-platform': platform,
      },
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.unlocked) {
      setShareUnlockedTaskId(currentResult.task_id)
      Events.shareUnlockClaim(userId, platform, currentResult.task_id)
    }
  } catch {}
}}
```

**下载按钮逻辑**：

```typescript
const canExportNoWatermark = 
  currentResult.remove_watermark || 
  shareUnlockedTaskId === currentResult.task_id

const downloadUrl = canExportNoWatermark
  ? `/api/video/download-nowm/${currentResult.task_id}`
  : `/api/video/download/${currentResult.task_id}`

const usedShareUnlock = canExportNoWatermark && !currentResult.remove_watermark

// 下载时埋点（区分 paid vs share）
onClick={async (e) => {
  e.preventDefault()
  if (canExportNoWatermark) {
    Events.downloadClick(userId, { videoId: currentResult.task_id })
    if (usedShareUnlock) {
      Events.downloadNoWatermarkViaShare(userId, currentResult.task_id)
    } else if (currentResult.remove_watermark) {
      Events.downloadNoWatermarkPaid(userId, currentResult.task_id)
    }
  }
  // ... 下载逻辑
}}

// 按钮文案
{canExportNoWatermark ? 'Download (No Watermark)' : 'Download preview'}

// 水印提示（明确限时一次）
{currentResult.remove_watermark ? (
  <span className="text-xs text-green-400 px-2">✓ No Watermark</span>
) : shareUnlockedTaskId === currentResult.task_id ? (
  <span className="text-xs text-green-400 px-2">Unlocked: 1× no-watermark export (valid for 10 minutes)</span>
) : (
  <span className="text-xs text-gray-400 px-2">Preview watermark</span>
)}
```

**分享区标题**：

```typescript
{!currentResult.remove_watermark && shareUnlockedTaskId !== currentResult.task_id
  ? 'Share to remove watermark'
  : 'Share this video'}
```

---

## 埋点与追踪

### 事件类型

**文件**：`lib/analytics/events.ts`

```typescript
export type EventName =
  | 'share_click'                    // 分享（区分平台）
  | 'share_unlock_claim'             // 领取 share-unlock
  | 'download_no_watermark_via_share' // 通过 share-unlock 的去水印下载
  | 'download_no_watermark_paid'     // 付费去水印下载（用于计算替代率）
  | 'download_click'                 // 下载（含 videoId）
```

### 事件函数

```typescript
Events.shareClick(userId, platform, videoId)
Events.shareUnlockClaim(userId, platform, taskId)
Events.downloadNoWatermarkViaShare(userId, taskId)
Events.downloadNoWatermarkPaid(userId, taskId)  // 新增：区分付费路径
Events.downloadClick(userId, { videoId })
```

### Admin 指标建议

- `success_to_share_click`：成功 → 分享点击率
- `share_click_rate_by_platform`：各平台分享占比
- `share_unlock_claim_rate`：分享 → 领取 unlock 率
- `share_unlock_to_download_rate`：领取 → 下载率
- **`share_unlock_cannibalization_rate`**：Share Unlock 替代付费率 = `download_no_watermark_via_share` / (`download_no_watermark_via_share` + `download_no_watermark_paid`)

### Admin 红线告警（推荐）

**规则**：如果某天 `share_unlock_daily_counts.hits` 的 P95 > 2 × 近 7 日均值 → 标红告警

**SQL 示例**：

```sql
WITH daily_stats AS (
  SELECT 
    day,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY hits) AS p95_hits,
    AVG(hits) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_7d
  FROM share_unlock_daily_counts
  WHERE day >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY day
)
SELECT day, p95_hits, avg_7d,
  CASE WHEN p95_hits > 2 * avg_7d THEN 'ALERT' ELSE 'OK' END AS status
FROM daily_stats
WHERE day = CURRENT_DATE;
```

**原因**：能第一时间发现被脚本刷或某个内容在社媒爆了（这是好事，但你要知道）

---

## 部署检查清单

### 1. 数据库迁移

```bash
# 在 Supabase Dashboard 或 CLI 执行
supabase migration up
```

**检查**：

- [ ] `video_tasks` 表有 `share_unlocked_at`、`share_unlocked_by`、`share_unlock_used`、`share_unlock_expires_at`
- [ ] `share_unlock_daily_counts` 表存在
- [ ] `rpc_share_unlock_allow` 函数存在且可执行（`authenticated`、`service_role` 有权限）

### 2. 环境变量

```bash
# 可选：自定义每日限额（默认 3）
SHARE_UNLOCK_DAILY_LIMIT=3
```

### 3. 类型定义

- [ ] `types/database.ts` 中 `video_tasks` 的 Row/Insert/Update 包含 share-unlock 字段

### 4. 前端验证

- [ ] 分享按钮显示正常（X / Facebook / Copy / Instagram）
- [ ] 点击分享后 toast 显示正确
- [ ] Share-unlock 领取成功（状态更新、按钮文案变化）
- [ ] 下载按钮根据 unlock 状态切换 URL 和文案
- [ ] 水印提示显示正确（No Watermark / Unlocked / Preview watermark）

### 5. API 测试

```bash
# Share-unlock 领取
curl -X POST https://your-domain.com/api/video/share-unlock/<taskId> \
  -H "Authorization: Bearer <token>" \
  -H "x-share-platform: twitter"

# 去水印下载
curl https://your-domain.com/api/video/download-nowm/<taskId> \
  -H "Authorization: Bearer <token>" \
  --output video.mp4
```

### 6. 分享页验证

- [ ] `/share/<taskId>` 可访问（成功任务）
- [ ] OG tags 正确（title、description、image/video）
- [ ] `canonical` 指向 share URL
- [ ] 失败任务返回 404 或友好提示

---

## 常见问题

### Q: 为什么 download-nowm 没有 409？

**A**：当前实现中，无水印文件与预览共用 `video_tasks.video_url`（无单独 `no_watermark_url`）。若后续有单独无水印 URL，可在 download-nowm 中优先使用该字段，缺失时再回退到 `video_url`。

### Q: 每日限额如何重置？

**A**：`share_unlock_daily_counts` 按 `day`（DATE）分区，每日 UTC 00:00 自动重置。RPC `rpc_share_unlock_allow` 会按 `day` 查询/插入，无需手动清理。

### Q: Share-unlock 过期后能否重新领取？

**A**：不能。每条视频最多领 1 次（`share_unlocked_at` 非空即表示已领取）。过期后只能通过付费（`remove_watermark`）获得去水印导出。

### Q: 如何查看每日限额使用情况？

**A**：查询 `share_unlock_daily_counts`：

```sql
SELECT day, user_id, hits, last_task_id, last_platform, updated_at
FROM share_unlock_daily_counts
WHERE day = CURRENT_DATE
ORDER BY hits DESC;
```

### Q: 时间窗口为什么用 `completed_at` 而不是 `created_at`？

**A**：`completed_at` 是用户心智完成点，最公平。`created_at` 在队列慢/重试时会产生误杀（用户等待很久后无法领取）。代码中如果 `completed_at` 为空，直接返回 409（未完成不可领）。

### Q: Share 页如何防止被反向爬取？

**A**：当前仅检查 `status === 'succeeded'`。未来可扩展：
- `deleted_at IS NULL`（软删除保护）
- `visibility = 'public'`（私密生成保护）

代码中已预留注释，待字段就绪后启用。

---

## 相关文件

| 类型 | 路径 |
|------|------|
| Migration | `supabase/migrations/131_share_unlock_video_tasks.sql` |
| Migration | `supabase/migrations/132_share_unlock_daily_counts.sql` |
| Migration | `supabase/migrations/133_share_unlock_conversion_gate.sql` |
| API | `app/api/video/share-unlock/[taskId]/route.ts` |
| API | `app/api/video/download-nowm/[taskId]/route.ts` |
| Admin API | `app/api/admin/share-unlock-gate/route.ts` |
| Share Page | `app/share/[taskId]/page.tsx` |
| Component | `components/SocialShareButtons.tsx` |
| Component | `components/growth/ShareUnlockUpsell.tsx` |
| Frontend | `app/video/VideoPageClient.tsx` |
| Utils | `lib/utils/url.ts`（`getSharePageUrl`） |
| Events | `lib/analytics/events.ts` |
| Types | `types/database.ts` |
| Docs | `docs/SOCIAL_SHARE.md` |
| Quick Ref | `docs/SHARE_UNLOCK_QUICK_REF.md` |

---

## Share-Unlock 转化 Gate

### Gate 名称：`SHARE_UNLOCK_CONVERSION_GATE`

**定位**：只读判定 Gate，判断 Share-Unlock 是否在"促转化"，而不是在"替代付费"。

### 输入指标（7 日滚动）

| 字段 | 说明 | 数据来源 |
|------|------|----------|
| `share_unlock_claim_rate` | 分享点击 → 成功领取 unlock | `share_click` / `share_unlock_claim` |
| `share_unlock_to_download_rate` | 领取 unlock → 实际去水印下载 | `share_unlock_claim` / `download_no_watermark_via_share` |
| `share_unlock_to_paid_rate` | 领取 unlock 后 48h 内付费率 | `share_unlock_claim` + `recharge_records` |
| `paid_without_share_rate` | 未使用 unlock 的自然付费率 | `recharge_records`（排除有 unlock 的用户） |
| `download_nowm_via_share_ratio` | 去水印下载中，share 占比 | `download_no_watermark_via_share` / (`download_no_watermark_via_share` + `download_no_watermark_paid`) |

### Gate 判定逻辑

**🟢 GREEN（健康，可继续）**

```
share_unlock_to_paid_rate ≥ paid_without_share_rate × 0.8
AND
download_nowm_via_share_ratio ≤ 40%
AND
share_unlock_claim_rate ≤ 60%
```

**允许动作**：可 A/B 分享文案、可微调展示位置、可测试更强二跳文案

**🟡 YELLOW（观察，禁止放量）**

```
share_unlock_to_paid_rate < paid_without_share_rate × 0.8
AND ≥ paid_without_share_rate × 0.5
OR
download_nowm_via_share_ratio 在 40%–60%
```

**允许动作**：只允许文案级优化

**禁止**：提高每日限额、给更长时长、扩大触达面

**🔴 RED（替代付费，立刻收紧）**

```
share_unlock_to_paid_rate < paid_without_share_rate × 0.5
OR
download_nowm_via_share_ratio ≥ 60%
OR
单日 share_unlock_daily_counts P95 突增 ≥ 2×
```

**自动建议动作**：将 share-unlock 限制到更短时长、或仅限某模型、或缩短 unlock 窗口（10min → 5min）

### Admin API

**GET** `/api/admin/share-unlock-gate`

返回：

```typescript
{
  success: true,
  gate: 'GREEN' | 'YELLOW' | 'RED' | 'LOCKDOWN',
  metrics: { ... },
  recommendedAction: '...',
  cannibalizationRisk: 'Low' | 'Medium' | 'High'
}
```

**文件**：
- Migration：`supabase/migrations/133_share_unlock_conversion_gate.sql`
- API：`app/api/admin/share-unlock-gate/route.ts`

---

## Share-Unlock → 付费二跳文案

### 组件：`ShareUnlockUpsell`

**文件**：`components/growth/ShareUnlockUpsell.tsx`

**触发时机**：
1. 完成一次 share-unlock 去水印下载
2. unlock 即将过期（剩 < 2 分钟）

**主文案**：

```
标题：Want this quality every time?

正文：
You've unlocked one clean export by sharing.
Upgrade to remove watermarks on all videos, anytime.

CTA：
主按钮：Upgrade for unlimited exports
次按钮：Continue with watermark
```

**轻量版**（`ShareUnlockUpsellLight`）：

```
This was a one-time unlock.
Upgrade to export watermark-free videos anytime.
```

**心理点**：
- 把 unlock 定义为「sample」，不是「奖励」
- 把付费定义为「稳定性 + 连续性」

---

## Share-Unlock 资格：模型/时长限制

### 推荐策略（写死规则）

| 模型/时长 | 资格 | 说明 |
|-----------|------|------|
| **Veo 8s** | ✅ 默认允许 | 成本低、生成快、分享意愿高、替代风险低 |
| **Sora 10s** | ⚠️ 谨慎（GREEN Gate 时） | 可交付长度，需严格限额（每日 ≤1） |
| **Sora 15s** | ❌ 禁止 | 可商用级，极易形成"分享即完成任务" |

### 实现

**代码**：`app/api/video/share-unlock/[taskId]/route.ts`

```typescript
// Share-Unlock Eligibility
const isEligible = (() => {
  const model = row.model?.toLowerCase() || ''
  const duration = row.duration || 0
  
  if (model.includes('veo') && duration === 8) return true  // Veo 8s ✅
  if (model.includes('sora') && duration === 10) return true  // Sora 10s ⚠️
  if (model.includes('sora') && duration === 15) return false  // Sora 15s ❌
  return true  // 其他：向后兼容
})()

if (!isEligible) {
  return 403 // Share unlock not available for this video type
}
```

**未来扩展**：可接入 `rpc_share_unlock_conversion_gate()` 结果，RED 时仅允许 Veo 8s。

---

## 更新日志

- **2026-02-03**：初始实现
  - 社交分享（Twitter/Facebook/Instagram/Copy）
  - Share-unlock 权益领取
  - 每日限额表 + RPC
  - 去水印下载 API
  - 分享页（OG tags）
- **2026-02-03**：转化 Gate + 二跳文案 + 模型限制
  - Share-Unlock Conversion Gate（GREEN/YELLOW/RED）
  - Share-Unlock → 付费二跳文案组件
  - 模型/时长资格限制（Veo 8s ✅ / Sora 10s ⚠️ / Sora 15s ❌）
