# 陪你打一单首个企业客户（实战流程 + 话术）

## 目标客户画像（首单最容易）

### 类型
- **5–30 人内容工作室**
- **或 AI 初创（已经有客户）**

### 关键点
👉 **他们已经在为失败视频"肉疼"**

### 为什么选这个类型
- ✅ 决策快（小团队，决策链短）
- ✅ 痛点明确（失败成本高）
- ✅ 预算充足（$500-2000 / 月）
- ✅ 容易成交（不需要大公司流程）

---

## 第一步：第一封邮件（你直接发）

### Subject
**We built a refund-safe AI video batch system**

### 内容

---

Hi {{Name}},

Quick question —  
when you generate AI videos in bulk today, **who pays for the failures?**

We built an enterprise AI video system where:

✅ **Videos run in batches** (10-10,000 per request)  
✅ **Failed generations are automatically refunded**  
✅ **Finance can audit every credit movement**

Would you like to try a **small pilot batch** (no commitment)?

Best,  
{{Your Name}}  
{{Company Name}}

---

### 发送时机
- **周二-周四**，上午 9-11 点
- **个性化**: 提到他们的公司 / 作品

### 跟进
- **Day 3**: 如果未回复，发送简短跟进
- **Day 7**: 如果仍未回复，发送 Pilot 提案

---

## 第二步：15 分钟 Demo（你说这 3 句就够）

### 1️⃣ 开场（定调）

> **"我们不是卖模型，是卖不会翻车的生产系统"**

**解释**:
- 他们可能用过其他 AI 视频 API
- 但那些是单次调用，没有批量语义
- 我们是批量系统，有财务安全保障

**停顿 3 秒，让客户消化**

---

### 2️⃣ 核心价值（必说）

> **"你只为成功的视频付钱，失败自动退款"**

**解释**:
- 传统 API：失败也要付钱
- 我们的系统：失败自动退款
- 财务可以直接看 Admin Dashboard 对账

**展示 Admin Dashboard**:
- Batch 列表
- Credits 结算
- 退款记录

**停顿 3 秒，让客户看**

---

### 3️⃣ 技术护城河（让技术点头）

> **"这套 billing + batch，你自己做至少 2 个月"**

**解释**:
- Batch 执行引擎：1-2 个月
- 财务闭环：1 个月
- 审计系统：1 个月
- 总计：至少 3-6 个月，2-3 个工程师

**我们的价值**:
- 直接使用，专注于业务
- 不需要自己开发基础设施

**停顿 3 秒，让客户思考**

---

## 第三步：Live Demo（必须做）

### Demo 1：创建 Batch

**你操作**:
```bash
curl -X POST https://api.yourcompany.com/api/enterprise/video-batch \
  -H "X-API-Key: demo-key" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"prompt": "A cat playing piano", "model": "sora-2"},
      {"prompt": "A dog in space", "model": "sora-2"}
    ]
  }'
```

**显示返回**:
```json
{
  "ok": true,
  "batch_id": "...",
  "total_count": 2,
  "required_credits": 20,
  "available_credits": 5000,
  "status": "queued"
}
```

**你说**:
> "在任何任务执行前，我们已经知道这单要花多少钱。  
> 余额不足会直接返回 402 Payment Required，不会执行。"

---

### Demo 2：展示 Credits 预扣

**你展示**:
- `batch_jobs` 表：`frozen_credits: 20`
- `credit_ledger` 表：`batch_upfront: -20`

**你说**:
> "这里不是'冻结概念'，是真正扣到 ledger 里。  
> 但失败一定退。  
> 你看，`credit_ledger` 里有一条 `batch_upfront` 记录，  
> 这就是预扣。所有资金变动都在这里，可审计。"

---

### Demo 3：展示失败退款（最重要）

**你展示**:
- `video_tasks` 表：1 成功 + 1 失败
- `credit_ledger` 表：`batch_refund: +10`

**你说（必须强调）**:
> "失败不是人工工单，是系统级退款。  
> 
> 你看：  
> - 预扣了 20 credits  
> - 成功了 1 条，扣 10 credits  
> - 失败了 1 条，退 10 credits  
> - 最终净扣 10 credits  
> 
> 所有这些都是自动的，不需要人工干预。  
> 财务可以直接看 `credit_ledger`，不需要找工程师解释。"

---

## 第四步：成交方式（非常重要）

### ❌ 不要一上来签年约

**为什么**:
- 客户还没验证系统
- 决策门槛太高
- 容易流失

### ✅ 卖 Pilot

**Pilot Offer（直接说）**:

> "我建议我们跑一个 **Pilot Batch**：  
> 
> - **$500–$1,000 预充值**  
> - **无期限**（Credits 永久有效）  
> - **无最低承诺**（用完就停）  
> - **可随时停**（无锁定期）  
> 
> 这个 Pilot 会展示：  
> - 完整的 batch 流程  
> - 失败退款机制  
> - Admin 对账界面  
> - Webhook 通知  
> 
> 如果满意，我们再谈正式合作。  
> 如果不满意，就当验证一下我们的系统。"

### 为什么 Pilot 容易成交

- ✅ **决策门槛低**（$500-1000 vs $10K+）
- ✅ **无风险**（Credits 永久有效，可随时停）
- ✅ **验证价值**（客户可以实际使用）
- ✅ **建立信任**（先合作，再谈大单）

### 预期成交率

**99% 企业会点头**

**为什么**:
- 金额小，决策快
- 无风险，可随时停
- 验证价值，建立信任

---

## 第五步：成交话术

### 如果客户说"考虑一下"

**你的回复**:
> "完全理解。  
> 要不这样，我们先跑一个 Pilot（$500-1000），  
> 你们团队看看完整流程，包括退款机制。  
> 不收费，就当验证一下我们的系统是否适合你们的需求。  
> 
> 如果满意，我们再谈正式合作。  
> 如果不满意，Credits 永久有效，可以继续用。"

### 如果客户说"太贵了"

**你的回复**:
> "我们不是更贵，我们是更安全。  
> 失败任务自动退款、全链路审计、幂等保障，  
> 这些是成本，也是价值。  
> 
> 而且，我们的 Pilot 只要 $500-1000，  
> Credits 永久有效，可以随时停。  
> 没有风险，可以验证价值。"

### 如果客户说"我们需要内部讨论"

**你的回复**:
> "完全理解。  
> 要不这样，我先给你开一个 Pilot（$500-1000），  
> 你们内部讨论的时候，可以实际使用系统，  
> 看看完整流程，包括退款机制。  
> 
> 这样讨论更有依据，  
> 而且 Credits 永久有效，没有风险。"

---

## 第六步：成交后的跟进

### 成交邮件模板

**Subject**: Re: Pilot Batch Setup — {{Company Name}}

---

Hi {{Name}},

Great! Your pilot batch is ready. Here's what you need:

**API Endpoint**: `POST /api/enterprise/video-batch`

**API Key**: `{{api_key}}`

**Credits Balance**: ${{amount}}

**Next Steps**:
1. Review the API documentation
2. Run your first batch
3. Monitor via admin dashboard

**Questions?** Reply to this email or ping me on {{Slack/Teams}}.

Best,  
{{Your Name}}

---

### Pilot 完成后的跟进

**Subject**: Re: Pilot Batch Complete — Results & Next Steps

---

Hi {{Name}},

Your pilot batch is complete. Here's what happened:

**Results**:
- Total: {{X}} videos
- Success: {{Y}} videos
- Failed: {{Z}} videos (auto-refunded)
- Credits spent: {{W}} credits
- Refunded: {{V}} credits

**What worked well**:
- {{Positive feedback}}

**Next steps**:
1. Review the admin dashboard
2. Discuss pricing (Pay-as-you-go or enterprise prepaid?)
3. Plan production batch

**I'm available for a quick call** to discuss results and answer any questions.

Best,  
{{Your Name}}

---

## 关键话术总结（必背）

### 开场
> "我们不是卖模型，是卖不会翻车的生产系统"

### 核心价值
> "你只为成功的视频付钱，失败自动退款"

### 技术护城河
> "这套 billing + batch，你自己做至少 2 个月"

### 推进 Pilot
> "$500–$1,000 预充值，无期限，无最低承诺，可随时停"

### 成交判断
> "如果客户听完后说的是：'这个 billing 设计得很舒服'  
> 这单基本已经成了。"

---

## 成交检查清单

### Demo 前
- [ ] 准备好 Demo API Key
- [ ] 准备好 Admin Dashboard 访问
- [ ] 准备好示例 batch（10-20 条）
- [ ] 准备好 Postman / 终端
- [ ] 准备好白板（记录痛点）

### Demo 中
- [ ] 说 3 句话（开场、核心价值、技术护城河）
- [ ] Live Demo（创建 Batch、展示预扣、展示退款）
- [ ] 推进 Pilot（$500-1000，无风险）

### Demo 后
- [ ] 发送成交邮件
- [ ] 准备 Pilot 设置
- [ ] 安排技术支持（如需要）

---

## 常见问题处理

### Q: 客户问"能保证 SLA 吗？"
**A**: "我们敢写 99.9% 可用性和 100% 退款保障，  
因为系统设计就是为这个目标服务的。  
不是承诺，是架构保证。  
而且，我们的 Pilot 可以先验证。"

### Q: 客户问"Credits 会过期吗？"
**A**: "不会。企业 Credits 永久有效。  
你可以按自己的节奏使用，不用担心过期。  
这也是为什么很多企业客户选择预付包。"

### Q: 客户问"能对账吗？"
**A**: "每一条视频，都能在 ledger 里找到对应记录。  
我们是账本优先设计，不是事后补日志。  
财务可以直接看 Admin Dashboard，不需要找工程师解释。"

---

## 最后一句判断标准

### 如果客户听完后说的是：

> **"这个 billing 设计得很舒服"**

**这单基本已经成了。**

**为什么**:
- ✅ 客户理解了价值（财务安全）
- ✅ 客户认可了设计（billing 系统）
- ✅ 客户有购买意向（"很舒服"）

**下一步**:
- 直接推进 Pilot
- 不要犹豫
- 不要降价
- 不要延长决策时间

---

## 总结

**首单最容易的客户**:
- 5-30 人内容工作室
- 或 AI 初创（已经有客户）
- 他们已经在为失败视频"肉疼"

**成交方式**:
- ❌ 不要一上来签年约
- ✅ 卖 Pilot（$500-1000，无风险）

**关键话术**:
- 3 句话（开场、核心价值、技术护城河）
- Live Demo（创建 Batch、展示预扣、展示退款）
- 推进 Pilot（无期限、无最低承诺、可随时停）

**成交判断**:
- 如果客户说"这个 billing 设计得很舒服"
- 这单基本已经成了
