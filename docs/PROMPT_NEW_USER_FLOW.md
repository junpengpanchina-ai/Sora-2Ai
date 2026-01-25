# 新用户默认 Prompt 路径（One-path to First Success）

目标：把新用户从“我不知道怎么写”带到“30 秒出片 → 再来一次 → 充值”。  
核心原则：**缩短 \(T\_{first\_success}\)**、提升 **completion_rate**、拉高 **reuse_rate**、提升 **ΔCR**。  

## 路径总览（5 步，必须短）

### Step 0：入口只给 2 个按钮（避免选择焦虑）

页面：生成入口（Generate）

- **Start with a Template（默认）**
- **Paste my own prompt（高级）**

> 让 80% 用户走模板，不要让他们一上来写作文。

### Step 1：Goal Picker（只问 1 个问题）

问法：你今天要做什么？

- Ads（卖货 / 拉新）
- Social（短视频涨粉）
- Explainer（产品介绍）
- Announcement（上新/活动）

说明：这一步直接映射你当前最通用的 4 类场景模板池。

### Step 2：行业 + 1 个关键变量（只填 2 个字段）

UI（两格输入）：

- Industry（下拉，默认推荐）
- Brand / Product name（可选）

其余变量全部默认值（例如：`duration=10s`、`aspect_ratio=9:16`、`style=clean`）。

目标：降低心智负担，提升 **completion_rate**。

### Step 3：一键生成（带“失败兜底”）

按钮：**Generate Video**

如果失败：不要让用户自己改，直接给系统级兜底动作：

- **Fix & Retry**（默认）：I’ll simplify the prompt and retry
- Switch to a safer style
- Shorten duration

目标：把失败变成“系统的事”，提升 **completion_rate**。

### Step 4：成功后立刻引导“复用一次”

成功页不要让用户停：

- **Make 3 variants**（默认选中）
- Change hook / Change style（2 个 quick chips）
- Save as Favorite（收藏）

目标：专门拉 **reuse_rate**（让用户自然做第 2 次执行）。

### Step 5：充值转化（在第 2 次成功后弹，不要太早）

触发条件（强建议，二选一即可）：

- 用户成功生成 ≥ 2 次（或复用 ≥ 1 次）
- 或 credits < 某阈值

弹窗文案要基于行为：

> You’ve generated 2 videos successfully. Want faster generation + more credits?

目标：专门拉 **ΔCR / LTV**，不靠“价格页”硬转化。

## 必须补齐的埋点（让 LTV 指标自动驾驶）

写入 `prompt_template_events`：

- `execute`
- `success`
- `failure`
- `paid`

强烈建议新增（可选但很值）：

- `variant_generate`（做 variants 时）
- `favorite`（收藏）

> 当 Step 1–4 的埋点完整后，4 个 LTV 指标就能真正变成“自动驾驶仪”。

