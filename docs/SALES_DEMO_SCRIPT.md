# Sales Demo Script (30 分钟 · 可照稿演示)

## 目标
技术信任 + 财务安全感 + 当场推进 Pilot

---

## 0–3 分钟｜开场（定调）

### 你说：

> "今天我不打算给你看一个'炫酷 AI Demo'，  
> 而是给你看一套可以放心上生产、财务能签字的 AI 视频系统。"

### 抛出问题（必问）：

1. **"你们现在视频是单条生成，还是批量？"**
   - 如果回答"单条" → "那批量需求怎么处理？"
   - 如果回答"批量" → "失败的任务怎么处理？"

2. **"出错的视频，钱怎么处理？"**
   - 如果回答"人工退款" → "那财务对账麻烦吗？"
   - 如果回答"不退" → "那成本怎么控制？"

3. **"财务是事后对账，还是事前能控？"**
   - 如果回答"事后" → "那预算超支怎么办？"
   - 如果回答"事前" → "那失败任务的钱呢？"

### 让客户先承认：现在是痛的

**记录客户痛点**（写在白板上）:
- [ ] 批量生成困难
- [ ] 失败成本不可控
- [ ] 财务对账麻烦

---

## 3–8 分钟｜问题拆解（为什么现有方案不行）

### 你说（可照读）：

> "我们看到大多数 AI 视频 API 有三个致命问题：  
> 
> **1️⃣ 单条请求，没有批量语义**  
> 企业需要生成 100 条视频，要发 100 次 API 请求。  
> 没有统一的 batch 概念，失败、重试、结算都是散的。  
> 
> **2️⃣ 失败即成本，没有退款机制**  
> 网络错误、模型失败、超时 → 钱扣了，视频没生成。  
> 要么人工退款（麻烦），要么认亏（成本不可控）。  
> 
> **3️⃣ 财务和技术是两条断裂的线**  
> 技术知道哪些视频生成了，财务不知道花了多少钱。  
> 对账要工程师配合，审计要查日志，效率低。"

### 一句压死：

> "这在 POC 阶段没问题，  
> 但在企业规模，这是不可接受的。"

**停顿 3 秒，让客户消化**

---

## 8–15 分钟｜核心系统演示（技术护城河）

### Demo 1：创建 Batch（API or UI）

#### 你操作：

**打开终端 / Postman**，执行：

```bash
curl -X POST https://api.yourcompany.com/api/enterprise/video-batch \
  -H "X-API-Key: demo-key" \
  -H "X-Request-ID: demo-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"prompt": "A cat playing piano", "model": "sora-2"},
      {"prompt": "A dog in space", "model": "sora-2"},
      {"prompt": "A bird flying over ocean", "model": "sora-2"}
      // ... 10-20 条
    ],
    "webhook_url": "https://customer.com/webhook"
  }'
```

#### 显示返回 JSON：

```json
{
  "ok": true,
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_count": 20,
  "cost_per_video": 10,
  "required_credits": 200,
  "available_credits": 5000,
  "status": "queued",
  "request_id": "demo-1234567890",
  "balance_snapshot": true,
  "enqueue": "queued"
}
```

#### 你讲重点（逐条点）：

- **`total_count: 20`** → "一次提交 20 条任务"
- **`cost_per_video: 10`** → "每条 10 credits"
- **`required_credits: 200`** → "这单需要 200 credits"
- **`available_credits: 5000`** → "你账户有 5000 credits，够用"
- **`status: queued`** → "已入队，等待执行"
- **`request_id`** → "幂等保护，重复请求不会重复创建"

#### 关键一句：

> "在任何任务执行前，我们已经知道这单要花多少钱。  
> 余额不足会直接返回 402 Payment Required，不会执行。"

---

### Demo 2：Worker 执行 & 预扣

#### 你展示：

**打开 Admin Dashboard** → `batch_jobs` 表

**显示字段变化**:
- `status`: `queued` → `processing`
- `frozen_credits`: `0` → `200`

**打开 `credit_ledger` 表**，显示：

```
ref_type: batch_upfront
ref_id: 550e8400-e29b-41d4-a716-446655440000
credits_delta: -200
created_at: 2026-01-20 10:00:00
```

#### 你说：

> "这里不是'冻结概念'，是真正扣到 ledger 里。  
> 但失败一定退。  
> 
> 你看，`credit_ledger` 里有一条 `batch_upfront` 记录，  
> 这就是预扣。所有资金变动都在这里，可审计。"

---

### Demo 3：失败退款（最重要）

#### 你展示：

**打开 `video_tasks` 表**，显示：

| batch_index | status | video_url | error_message |
|------------|--------|-----------|---------------|
| 0 | succeeded | https://... | - |
| 1 | failed | - | timeout |

**打开 `credit_ledger` 表**，显示两条记录：

```
1. ref_type: batch_upfront
   credits_delta: -200
   
2. ref_type: batch_refund
   credits_delta: +10  (失败 1 条，退 10 credits)
```

**打开 `batch_jobs` 表**，显示：

```
status: partial
success_count: 19
failed_count: 1
credits_spent: 190  (19 × 10)
frozen_credits: 200
settlement_status: refunded
```

#### 你说（必须强调）：

> "失败不是人工工单，是系统级退款。  
> 
> 你看：  
> - 预扣了 200 credits  
> - 成功了 19 条，扣 190 credits  
> - 失败了 1 条，退 10 credits  
> - 最终净扣 190 credits  
> 
> 所有这些都是自动的，不需要人工干预。  
> 财务可以直接看 `credit_ledger`，不需要找工程师解释。"

---

## 15–20 分钟｜财务 & 合规视角

### 你切 Admin：

**打开 Admin Dashboard** → `/admin/batches/[batch_id]`

#### 展示三个 Tab：

**1. Batch 概览**:
- Status: partial
- Total: 20
- Success: 19
- Failed: 1
- Frozen Credits: 200
- Credits Spent: 190
- **Refunded: 10** ← 重点

**2. Billing Tab**:
- Upfront Total: 200
- Refund Total: 10
- **Net Spent: 190** ← 重点
- Ledger 记录（可展开）

**3. Tasks Tab**:
- 所有任务的详细列表
- 成功/失败状态
- 错误信息（如果有）

#### 你说：

> "财务可以直接看这页，  
> 不需要找工程师解释。  
> 
> 每一笔钱都有记录，  
> 每一个失败都有原因，  
> 每一个 batch 都可以对账。  
> 
> 这就是为什么我们很多客户，  
> 是财务部门推动上线的。"

---

## 20–25 分钟｜SLA & 定价（让采购安心）

### 你说三点即可：

**1. 只为成功视频付费**
> "失败的任务自动退款，  
> 你只付成功视频的钱。"

**2. 失败自动退款**
> "网络错误、模型失败、超时 → 自动退款。  
> 不需要工单，不需要人工干预。  
> 100% 退款保障（SLA）。"

**3. Credits 不过期**
> "企业 credits 永久有效。  
> 你可以按自己的节奏使用，  
> 不用担心过期。"

### 然后停顿一句：

> "这也是为什么我们很多客户，  
> 是财务部门推动上线的。"

**让客户消化 3 秒**

---

## 25–30 分钟｜推进 Pilot（收口）

### 你直接说：

> "我建议我们跑一个 20 条视频的 Pilot Batch：  
> 
> - **不签年约**  
> - **不锁额度**  
> - **一周内完成**  
> - **你们只需要看结果**  
> 
> 这个 Pilot 会展示：  
> - 完整的 batch 流程  
> - 失败退款机制  
> - Admin 对账界面  
> - Webhook 通知  
> 
> 如果满意，我们再谈正式合作。  
> 如果不满意，就当验证一下我们的系统。"

### CTA（二选一）：

**选项 1（激进）**:
> "我今天就给你开 Key，  
> 你现在就可以跑一个 Pilot。"

**选项 2（保守）**:
> "还是你想下周再约一次技术评审？  
> 我可以准备更详细的技术文档。"

---

## 演示后跟进邮件模板

**主题**: Re: Demo Session — Next Steps

---

Hi {{Name}},

Thanks for the demo today. As discussed, here's a quick recap:

**What we covered:**
- Batch execution (10-10,000 videos per job)
- Financial safety (pre-freeze, auto-refund)
- Full auditability (admin dashboard)

**Next step:**
I'll set up a **20-video pilot batch** for your team. This will let you:
- See the full flow end-to-end
- Test with your actual use case
- Review the admin dashboard
- Verify the refund mechanism

I'll send the pilot setup details by {{Date}}.

Best,  
{{Your Name}}

---

## 演示技巧

### 1. 时间控制
- 开场 3 分钟（不要超）
- 演示 12 分钟（重点）
- 财务视角 5 分钟（让采购安心）
- 收口 5 分钟（推进 Pilot）

### 2. 互动技巧
- 开场必问 3 个问题（让客户承认痛点）
- 演示时暂停，让客户提问
- 收口时直接推进 Pilot（不要犹豫）

### 3. 话术要点
- 不要说"我们的系统很厉害"
- 要说"我们解决了你的痛点"
- 不要说"你可以试试"
- 要说"我们跑一个 Pilot"

### 4. 常见问题处理
- 如果客户问技术细节 → 指向文档，不要深入
- 如果客户问价格 → 指向 Pricing 文档，不要当场报价
- 如果客户说"考虑一下" → 直接推进 Pilot，降低决策门槛

---

## 演示检查清单

### 演示前
- [ ] 准备好 Demo API Key
- [ ] 准备好 Admin Dashboard 访问
- [ ] 准备好示例 batch（10-20 条）
- [ ] 准备好 Postman / 终端
- [ ] 准备好白板（记录痛点）

### 演示中
- [ ] 开场问 3 个问题
- [ ] 记录客户痛点
- [ ] 演示 3 个核心功能
- [ ] 展示 Admin Dashboard
- [ ] 推进 Pilot

### 演示后
- [ ] 发送跟进邮件
- [ ] 准备 Pilot 设置
- [ ] 安排技术评审（如果需要）

---

## 关键话术（必背）

### 开场
> "今天我不打算给你看一个'炫酷 AI Demo'，  
> 而是给你看一套可以放心上生产、财务能签字的 AI 视频系统。"

### 问题拆解
> "这在 POC 阶段没问题，  
> 但在企业规模，这是不可接受的。"

### 核心演示
> "在任何任务执行前，我们已经知道这单要花多少钱。"

### 失败退款
> "失败不是人工工单，是系统级退款。"

### 财务视角
> "财务可以直接看这页，  
> 不需要找工程师解释。"

### 收口
> "这也是为什么我们很多客户，  
> 是财务部门推动上线的。"

---

## 总结

**30 分钟演示的目标**:
1. ✅ 让客户承认痛点
2. ✅ 展示技术护城河
3. ✅ 让财务安心
4. ✅ 推进 Pilot

**不要做的事**:
- ❌ 炫技（不要展示"AI 很厉害"）
- ❌ 深入技术细节（指向文档）
- ❌ 当场报价（指向 Pricing 文档）
- ❌ 犹豫不决（直接推进 Pilot）

**要做的事**:
- ✅ 问痛点（让客户承认）
- ✅ 展示解决方案（技术护城河）
- ✅ 让财务安心（Admin Dashboard）
- ✅ 推进 Pilot（降低决策门槛）
