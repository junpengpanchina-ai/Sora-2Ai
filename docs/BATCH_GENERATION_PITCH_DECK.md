## Pitch Deck：AI Batch Video Production Platform

> Turning AI Video into a Scalable Business System

---

## Slide 1 · 标题

**AI Batch Video Production Platform**  
Turning AI Video into a Scalable Business System.

要点：
- 从「一次性生成」进化为「可控的批量生产线」。
- 面向创作者、工作室、企业的 AI 视频生产基础设施。

---

## Slide 2 · 问题（Problem）

**AI 视频生成 ≠ 可控生产**

现状：
- 工具层：大多数产品只能「单条点按钮」。
- 商业层：
  - 没有清晰的计费 / 结算体系。
  - 很难对账、很难做企业合同。
  - 批量生产靠脚本 & 人工运营。

结果：
- 生成越多，风险越大：
  - 无法管控成本。
  - 难以防刷 / 防滥用。
  - 很难对企业客户给出 SLA 和价格。

---

## Slide 3 · 解决方案（Solution）

**Batch Generation Engine**

产品形态：
- Prompt 模板化：支持变量占位（如 `{style} / {scene}`）。
- 批量执行：一次配置，生成 N×M×K 条视频。
- 成功才扣费：失败视频自动释放额度。
- 企业 API + Webhook：嵌入客户现有生产和投放流水线。

一句话：
> 把「AI 视频灵感」变成「可预测、可对账的内容生产线」。

---

## Slide 4 · 差异化（Why Now / Why Us）

| 维度        | 普通 AI 视频工具 | 我们：Batch Generation |
|-----------|------------------|------------------------|
| 批量生成      | ❌ 支持很弱/无       | ✅ 笛卡尔积批量生成          |
| 计费模型      | 模糊，按调用/分钟       | 精确到单条视频，失败不扣费         |
| 审计 & 对账   | 几乎没有            | 全链路 ledger + batch job |
| 企业 API   | 很少               | 标准化 REST + Webhook   |
| 风控与限流     | 基本缺失            | per-API-key 限流 + usage log |

技术壁垒：
- Wallet 冻结 / 清算模型（基于现有 `credit_wallet / credit_ledger`）。
- Batch Job 级别审计和访问日志（batch_jobs + video_external_access_log）。
- 企业 API Key + 限流 + 审计（enterprise_api_keys + enterprise_api_usage）。

---

## Slide 5 · 系统壁垒（Product / Tech Moat）

**不是 Prompt 壁垒，而是“系统级”壁垒：**

- 钱包层：
  - Credits 单一来源，扣费路径可追溯。
  - 按视频粒度结算，支持手工对账与审计。
- 任务层：
  - Batch Job 状态机（queued → processing → partial → completed / failed）。
  - 单条成功 / 单条失败，不阻断整批。
- 接入层：
  - 企业 API Key 管理、限流、使用日志。
  - Webhook 回调用于客户侧自动对账 & 入库。

这些能力，都已经在当前代码与 migrations 中有清晰落地路径。

---

## Slide 6 · 商业模式（Business Model）

三档清晰分层：

- **Starter · $4.9**
  - 体验包：单条生成，有限 credits。
  - 目的：转化、教育用户。

- **Pro Creator · \$29+/月**
  - 核心收入：
    - 批量生成（单批、单日限额）。
    - 无水印下载。
  - 面向创作者与小工作室。

- **Enterprise · \$299+ / 月（可到年付、定制）**
  - 批量生成 + 高并发。
  - API + Webhook。
  - 域名白名单、私有化选项、SLA。

可扩展收入：
- 定制模型 / 专用风格包。
- 更高并发 & 专线服务。

---

## Slide 7 · 增长路径（Go-to-Market）

1. **创作者**：
   - 通过单条生成 / Starter 引导。
   - 识别高频用户，引导升级 Pro Creator。
2. **工作室 / 代理公司**：
   - 提供批量能力作为「效率工具」。
   - 用案例展示：一次 campaign 生成 50–200 条视频。
3. **企业 & API 合作方**：
   - 开放 Enterprise API。
   - 通过 Webhook 嵌入客户 BI / 广告投放系统。

数据驱动迭代：
- 通过 batch_jobs / enterprise_api_usage 日志，识别 Top 使用场景与行业。

---

## Slide 8 · 愿景（Vision）

**Become the operating system for AI video production.**

从「单次生成视频」到：
- **可控**：每条视频成本、风控边界都清晰可见。
- **可扩展**：支持从个人到企业客户的所有规模。
- **可组合**：API / Webhook 级集成，成为别人系统中的一环。

这不是一个“酷炫 Demo”，而是一套可以跑 10 年的 AI 视频生产基础设施。

