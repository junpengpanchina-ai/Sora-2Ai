## Batch Generation PRD（AI 视频批量生产系统）

> **定位**：面向创作者 / 企业的 AI 视频批量生产系统  
> **用途**：对外融资、商务合作、内部技术评审  
> **状态**：Production-ready 设计文档（含产品、技术、计费与风控）

---

## 一、产品概述

- **产品名称**：Batch Generation（AI 视频批量生产）
- **目标用户**
  - 高频视频创作者（YouTube、抖音、电商达人）
  - 广告代理 / MCN / 制作公司
  - 有规模化视频需求的企业（电商、游戏、工具产品）
- **核心价值**
  - 一次配置 Prompt 模板，即可批量产出多变体视频。
  - 严格的 credits / wallet 扣费模型，确保「失败不扣费」。
  - 企业级 API + Webhook，对接客户现有生产/投放流水线。

---

## 二、使用场景

- **电商**：为 N 个 SKU 批量生成短视频，用于详情页、直播预热、广告投放。
- **广告代理**：为一次 Campaign 生成多版本创意，做 A/B/C 测试。
- **内容平台**：为每个话题 / 场景生产多模版视频（多语言、多风格、多机位）。
- **企业内部**：营销团队按季度批量生成模板化宣传/教程视频。

---

## 三、功能设计

### 3.1 批量入口与权限

- 入口：Dashboard 中的 `Batch Studio` 模块。
- 权限：
  - 仅 Pro / Enterprise 用户可见并可用。
  - 免费 / Starter 用户看不到或显示升级引导。

### 3.2 批量生成配置（左侧 Config Panel）

- **Prompt 模板编辑**
  - 文本域，支持 `{variable}` 形式的占位符。
  - 校验：至少一个变量；长度限制；敏感内容过滤。

- **变量矩阵配置**
  - 每个变量一行：`name` + 候选值组。
  - 支持勾选/取消某些变量值。
  - 实时计算笛卡尔积数量：  
    \[
      total = \prod_i |V_i|
    \]
  - 若 `total` 超过套餐允许的单批上限，按钮置灰，给出解释。

- **额度提示**
  - 显示：
    - 单批最大条数
    - 今日剩余容量
    - 预计本次消耗的 upper bound（冻结额度）

### 3.3 Batch Job 状态与结果列表（右侧 Timeline）

- 顶部显示当前 Batch：
  - `Batch #A93F · 状态：Processing (6 / 16)`
  - 进度条（按成功+失败 / 总数）。
- 下方为视频卡片网格：
  - 每条卡片：
    - 缩略图（生成中为 skeleton）
    - 实际展开后的 Prompt（模板 + 替换变量）
    - 状态：`queued / generating / success / failed`
    - 单条失败时提供「重试」按钮（可按套餐限制重试次数）。
- 支持部分成功，失败不影响整体任务状态推进。

### 3.4 错误与回退体验

- 单条失败：
  - 不扣费。
  - 支持单条重试（触发本地/后台风控限额校验）。
- 整批失败：
  - 释放冻结 credits。
  - 记录 batch 级别错误原因（上游 API 错误 / 风控拦截 / 配额不足）。

---

## 四、数据模型与 SQL 草案

> 以下为逻辑 SQL 模型，实际迁移可放在单独 migrations 文件中，并按现有 `credit_wallet` / `credit_ledger` 设计细化。

### 4.1 `batch_jobs`（批量任务）

```sql
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'processing', 'partial', 'completed', 'failed'
  )),
  total_count INT NOT NULL,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,

  cost_per_video INT NOT NULL,           -- 单条理论扣费
  frozen_credits INT NOT NULL DEFAULT 0, -- 本批冻结的总额度（用于审计）

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 4.2 视频记录与 batch 关联（示意）

> 如果你有独立 `videos` 表，可以按下列方式扩展；当前项目使用 `video_tasks` 也可以加上对应字段。

```sql
ALTER TABLE video_tasks
ADD COLUMN IF NOT EXISTS batch_job_id UUID REFERENCES batch_jobs(id),
ADD COLUMN IF NOT EXISTS batch_index INT;
```

---

## 五、钱包 & 扣费模型（与现有 `credit_wallet` / `credit_ledger` 对齐）

### 5.1 现有结构回顾

- `credit_wallet`：`permanent_credits` + `bonus_credits`（可用余额）
- `credit_ledger`：
  - `type`: `purchase | bonus_grant | spend | refund | adjust`
  - `model`: `sora-2 | veo-flash | veo-pro`
  - `credits_delta`: 正负数
  - `ref_type / ref_id / meta`: 用于扩展
- `deduct_credits_from_wallet()`：单笔扣费（优先 Bonus）。

### 5.2 批量任务的结算原则

- 创建 Batch 时，只要「当前余额 ≥ 理论最大消耗」，即可创建并冻结逻辑额度。
- 实际扣费 **按成功视频逐条记账**，失败自动「释放」冻结额度。
- 由于当前 wallet 没有 `frozen_credits` 字段，**冻结在账本层表示，而不影响可用余额数值**（避免大规模 schema 变更）。

### 5.3 建议的 `credit_ledger` 使用约定

不新增 type，而是约定：

- `type = 'spend'`：
  - `ref_type = 'batch_video_success'`
  - `ref_id = <video_task_id>`
  - `meta.batch_job_id = <batch_job_id>`
- `type = 'refund'`：
  - `ref_type = 'batch_video_failed_release'`
  - `ref_id = <video_task_id>` 或 `<batch_job_id>`
  - `meta.batch_job_id = <batch_job_id>`

这样可以：

- 保持与现有 CHECK 约束兼容。
- 在 Admin / BI 中按 `ref_type` 聚合，清晰地区分普通消费 vs 批量消费。

### 5.4 后端批量结算流程（伪代码）

```ts
// 1) 创建 batch_job 前：检查余额是否足够覆盖理论上限
const theoreticalMaxCost = totalCount * costPerVideo;
const balance = await get_total_available_credits(userId);
if (balance < theoreticalMaxCost) throw new Error("INSUFFICIENT_CREDITS");

// 2) 每条视频生成成功后：
await deduct_credits_from_wallet(userId, costPerVideo, modelType);
insert into credit_ledger (... 'spend', ref_type='batch_video_success', ...);

// 3) Batch 结束后：
//    不需要真的“解冻”，只要未成功的不扣费即可。
//    如需反映“预留额度”，可以只在元数据中记录 frozen_credits。
```

> 如需真正的钱包冻结（`frozen_credits`），可以在后续迭代中在 `credit_wallet` 上新增字段，并用新 migration 调整；当前方案保持兼容与低风险。

---

## 六、企业 API 与 Webhook

### 6.1 API 概述

- **授权方式**：`Authorization: Bearer <API_KEY>`
- **配额控制**：
  - 每个 API Key 的 **日批量上限 / 并发上限 / 每批最大 size**。
  - 超限时返回明确的业务错误码（`BATCH_LIMIT_EXCEEDED`）。

### 6.2 创建批量任务

```http
POST /api/enterprise/video-batch
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**请求体示例：**

```json
{
  "template": "A {style} style {scene} shot, camera {shot}, mood {mood}",
  "variables": {
    "style": ["cinematic", "anime"],
    "scene": ["city", "nature"],
    "shot": ["close-up", "wide"],
    "mood": ["calm", "dramatic"]
  },
  "max_outputs": 20,
  "model": "sora-2",
  "callback_url": "https://client.com/webhook/video-batch"
}
```

**响应示例：**

```json
{
  "ok": true,
  "batch_job_id": "uuid",
  "estimated_videos": 16,
  "status": "queued"
}
```

### 6.3 查询批量任务状态

```http
GET /api/enterprise/video-batch/{id}
Authorization: Bearer <API_KEY>
```

响应包含：`status / total / success / failed / videos[...]`。

### 6.4 Webhook 回调事件

统一结构：

```json
{
  "event": "batch.completed",
  "batch_job_id": "uuid",
  "user_id": "uuid",
  "total": 16,
  "success": 14,
  "failed": 2,
  "videos": [
    {
      "video_id": "uuid",
      "status": "success",
      "play_url": "https://...",
      "download_url": "https://...",
      "meta": {
        "prompt": "...",
        "variables": { "style": "cinematic", "scene": "city" }
      }
    }
  ]
}
```

**事件类型建议：**

- `batch.queued`
- `batch.processing`
- `batch.partial`
- `batch.completed`
- `batch.failed`

---

## 七、会员与套餐设计（4.9 / 高端 / 企业）

> 以下为建议定价与能力矩阵，可单独放入 `BATCH_PRICING_PLAN.md`。

### 7.1 Starter（$4.9）

- 面向尝鲜用户。
- 能力：
  - 单条生成。
  - 不开放批量生成。
  - Credits：50。

### 7.2 Pro Creator（示例：$29 / 月）

- 面向个人创作者 / 小团队。
- 能力：
  - 批量生成：✅
  - 单批最大：20 条
  - 每日上限：100 条
  - 下载：✅（无水印）
  - API：❌

### 7.3 Enterprise（起价 $299+ / 月）

- 面向企业与大型代理。
- 能力：
  - 批量生成：✅（高并发）
  - API：✅
  - Webhook：✅
  - 域名白名单 / 自定义水印 / 自定义模型：可选
  - SLA：可选

---

## 八、落地优先级建议

1. **P1**：Batch Job 基础表 + Admin 内部批量入口（先服务内部 / 少量高端用户）。
2. **P2**：接入现有 `credit_wallet / credit_ledger`，按「单条成功结算」方式跑通扣费与审计。
3. **P3**：开放企业 API + Webhook（灰度给少量 B 端合作方）。
4. **P4**：扩展钱包冻结字段与更细粒度风控（如需要）。

---

本 PRD 可以直接用于：

- 内部技术 / 产品 / 安全评审。
- 与潜在 B 端客户沟通批量能力与接入方式。
- 对外融资时，展示「从单体工具 → 平台能力」的清晰路径。

