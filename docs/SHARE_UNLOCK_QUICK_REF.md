# Share-Unlock 快速参考

## 一句话

用户**分享**后可为**本条视频**领取一次「去水印导出」；归属用 **video_tasks.user_id**；每日限额用 **share_unlock_daily_counts** + RPC 原子自增。

---

## 权限与限额

| 规则 | 说明 |
|------|------|
| 归属 | **video_tasks.user_id** = 当前登录用户 |
| 时间窗 | 仅 **completed_at 后 10 分钟内**可领 |
| 每日 | 每人每日最多 **3 次**（`SHARE_UNLOCK_DAILY_LIMIT` 可配） |
| 每视频 | 每条视频最多领 **1 次**（已有 share_unlocked_at 则幂等 200） |

---

## 文件一览

| 类型 | 路径 |
|------|------|
| Migration | `supabase/migrations/131_share_unlock_video_tasks.sql` |
| Migration | `supabase/migrations/132_share_unlock_daily_counts.sql` |
| API | `app/api/video/share-unlock/[taskId]/route.ts` |
| API | `app/api/video/download-nowm/[taskId]/route.ts` |
| 文档 | `docs/SOCIAL_SHARE.md` |

---

## API 速查

**POST** `/api/video/share-unlock/:taskId`  
- Header：`Authorization: Bearer <token>`，可选 `x-share-platform: twitter|facebook|instagram|copy`  
- 200：`{ unlocked: true, mode: 'share'|'paid', expiresAt?, dailyLimit?, hits? }`  
- 429：每日限额  
- 410：超过 10 分钟窗口  

**GET** `/api/video/download-nowm/:taskId`  
- 允许：`remove_watermark === true` 或 share-unlock 有效且未使用  
- 成功：流式返回 **video_tasks.video_url**（当前与预览共用同一 URL）  
- share 解锁路径：首次下载成功后置 `share_unlock_used = true`  

---

## 无水印文件来源

当前**无**单独 no_watermark 字段，与预览共用 **video_tasks.video_url**；若后续有单独无水印 URL，可在 download-nowm 中优先使用该字段。
