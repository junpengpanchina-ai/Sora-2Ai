# 社交分享功能说明

## 概述

支持将视频生成结果分享到 **Twitter/X**、**Facebook**、**Copy link**、**Instagram**（复制链接）。使用**干净分享 URL**（`/share/<taskId>`）和独立埋点（`share_click`），便于转化漏斗分析。

---

## 1) 平台策略

| 平台 | 方式 | UI / Toast |
|------|------|------------|
| **X (Twitter)** | 打开 `twitter.com/intent/tweet` | `text=...&url=...`，统一 `encodeURIComponent` |
| **Facebook** | 打开 `facebook.com/sharer/sharer.php?u=...` | 新窗口 |
| **Copy link** | 复制到剪贴板 | Toast: `Link copied!` |
| **Instagram** | 复制链接（无 web intent） | 按钮文案/tooltip: **Copy link for Instagram**；Toast: **Link copied — paste it into Instagram bio/story** |

Instagram 不提供外链分享 intent，文案明确为「Copy link for Instagram」，避免用户误以为会跳转发帖。

---

## 2) 分享专用 URL（强烈建议）

- **不要**用当前页 URL（带 query、utm、session 等）。
- **使用**干净 share URL：`https://sora2aivideos.com/share/<taskId>`
- 实现：
  - `lib/utils/url.ts`：`getSharePath(taskId)`、`getSharePageUrl(taskId)`
  - 分享页：`app/share/[taskId]/page.tsx`
- Share 页行为：
  - OG tags：`title`（prompt）、`description`、`image`/`video`（video_url）
  - `canonical` 固定为 share URL
  - `robots: { index: true, follow: true }`（可传播、可被索引）

---

## 3) Twitter intent 参数

- URL 形式：`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
- 先 `text` 后 `url`，统一用 `encodeURIComponent`。可选后续加 `via`、`hashtags`。

---

## 4) 埋点：分享与下载拆分

- **不要**在分享时复用 `downloadClick`，否则会污染漏斗。
- **保留**行为层状态：`setDidDownloadOrShare(true)`（用于 Veo nudge 等）。
- 事件拆分：
  - **下载**：`Events.downloadClick(userId, { videoId })`
  - **分享**：`Events.shareClick(userId, platform, videoId)`

Admin 可区分：
- `success_to_share_click` / `share_click_rate_by_platform`
- `success_to_download`

---

## 组件

### `components/SocialShareButtons.tsx`

**Props：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string` | 必填 | 分享专用 URL（建议 `getSharePageUrl(taskId)`） |
| `title` | `string` | `''` | 推文/分享文案 |
| `className` | `string` | `''` | 外层类名 |
| `platforms` | `SharePlatform[]` | `['twitter','facebook','copy','instagram']` | 顺序建议：X / Facebook / Copy link / Instagram |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按钮尺寸 |
| `onShare` | `(platform: SharePlatform) => void` | - | 分享时回调（埋点用） |

**使用示例：**

```tsx
<SocialShareButtons
  url={getSharePageUrl(currentResult.task_id)}
  title={currentResult.prompt ? `Check out this AI-generated video: ${currentResult.prompt}` : 'Check out this AI-generated video'}
  size="md"
  platforms={['twitter', 'facebook', 'copy', 'instagram']}
  onShare={(platform) => {
    setDidDownloadOrShare(true)
    Events.shareClick(userId, platform, currentResult.task_id)
  }}
/>
```

---

## 结果页排版建议

在 Download 区域**下方**：

1. 小标题：**Share this video**
2. 按钮行：**X / Facebook / Copy link / Instagram**（Copy link for IG）
3. 按钮下方一行小字（提升点击意愿）：
   > *Sharing helps you get feedback — link opens a clean preview page.*

---

## 转化漏斗建议

- 将「社交分享」纳入转化漏斗：首次成功用户先做「下载/分享」等正向动作，再考虑付费。
- Admin 仪表盘建议指标：
  - `success_to_share_click`
  - `share_click_rate_by_platform`

便于判断：新用户是「不想用」还是「想用但暂不付费」。

---

## Share to remove watermark（分享即解锁去水印）

- **规则**：用户点任意分享（X/FB/Copy/Instagram）后，可领取**本条视频**一次「去水印导出」权益（Share-Intent Unlock）。
- **防滥用**：仅登录用户、归属按 **video_tasks.user_id**、仅成功完成后 **10 分钟内**可领、每人每日最多 **3 次**（`SHARE_UNLOCK_DAILY_LIMIT` 可配）、每条视频最多领 **1 次**；每日限额用表 `share_unlock_daily_counts` + RPC `rpc_share_unlock_allow` 原子自增（风格对齐 `bad_url_daily_counts`）。
- **实现**：
  - 表：`video_tasks` 增加 `share_unlocked_at`、`share_unlocked_by`、`share_unlock_used`、`share_unlock_expires_at`（migration `131_share_unlock_video_tasks.sql`）。
  - 表：`share_unlock_daily_counts(day, user_id, hits, last_task_id, last_platform)` + RPC `rpc_share_unlock_allow`（migration `132_share_unlock_daily_counts.sql`）。
  - **POST** `/api/video/share-unlock/:taskId`：登录与归属校验、10 分钟窗口、每日限额（RPC）、幂等（已解锁且未过期直接 200）；请求头可选 `x-share-platform: twitter|facebook|instagram|copy`。
  - **GET** `/api/video/download-nowm/:taskId`：允许当 `remove_watermark === true`（付费）或 share-unlock 有效且未使用；share 解锁路径下首次下载成功后置 `share_unlock_used = true`。**当前无水印文件与预览共用 video_tasks.video_url**（无单独 no_watermark_url 字段）。
- **前端**：`onShare` 内 POST share-unlock 并带 `x-share-platform`，成功则 `setShareUnlockedTaskId(task_id)`；下载在已去水印/已 share-unlock 时走 download-nowm，文案 **Download (No Watermark)** / **Unlocked: No watermark export**。
- **埋点**：`share_unlock_claim`、`download_no_watermark_via_share`。Admin 可算 share → claim rate、claim → download rate。

---

## 扩展

- 增加平台（如 LinkedIn、WhatsApp）：在 `SocialShareButtons` 增加对应按钮与 `SharePlatform` 类型，并在 `shareClick` 的 `meta.platform` 中区分。
- 若需 `via` / `hashtags`：在组件内拼 Twitter intent 时追加参数即可。
