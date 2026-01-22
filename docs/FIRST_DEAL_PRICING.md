# 首单报价（具体到美元，直接发客户）

## 核心策略

**两段式报价**：不要一上来年约，先 Pilot 再 Growth

---

## 方案 A：Pilot（最容易成交）⭐ 主推

### 价格
**$999 预充值 Credits（不过期）**

### 支付链接
https://buy.stripe.com/6oUfZh03E6sbcttbyU0kE07

### 包含内容

- ✅ **Enterprise Batch API access**
  - 批量生成（10-10,000 条 / batch）
  - 并发控制（可配置）
  - 幂等保护（request_id）

- ✅ **Webhook callback**
  - HMAC-SHA256 签名
  - 指数退避重试
  - 批量完成通知

- ✅ **Idempotency（request_id）**
  - 100% 幂等保障
  - 防止重复扣费

- ✅ **Admin 审计面板（只读）**
  - Batch 详情
  - Credits 账本
  - 任务列表
  - Webhook 记录

- ✅ **Email support（48h）**
  - 工作日 48 小时内响应
  - 技术支持邮箱

### 条款一句话

> **"Pay only for successful videos — failed tasks are automatically refunded in credits."**

### 为什么选这个方案

- ✅ **决策门槛低**（$999 vs $10K+）
- ✅ **无风险**（Credits 永久有效，可随时停）
- ✅ **验证价值**（客户可以实际使用）
- ✅ **建立信任**（先合作，再谈大单）

### 预期成交率

**99% 企业会点头**

---

## 方案 B：Growth（客户要稳定再推）

### 价格
**$4,999 预充值 Credits（不过期）**

### 支付链接
https://buy.stripe.com/aFa4gz5nY2bV799auQ0kE08

### 包含内容

- ✅ **所有 Pilot 功能**
- ✅ **更高 rate limit / 并发**
  - Rate limit: 120 / 分钟（Pilot: 60 / 分钟）
  - 并发数: 可配置（Pilot: 默认）
- ✅ **优先队列**
  - 任务优先执行
  - 更快的处理速度
- ✅ **月度对账报表（CSV）**
  - 自动生成月度报表
  - CSV 格式，便于财务对账
- ✅ **支持渠道升级（可选 Slack）**
  - Email 支持（24h）
  - 可选 Slack 频道

### 升级时机

- 客户 Pilot 使用满意
- 客户需要更高并发
- 客户需要优先队列
- 客户需要月度报表

---

## 方案 C：Enterprise（你拿来做大单锚点）

### 价格
**$20,000 - $50,000 预充值 + SLA（可开票/合同）**

### 包含内容

- ✅ **所有 Growth 功能**
- ✅ **IP allowlist**
  - 指定 IP 白名单
  - 增强安全性
- ✅ **更严格风控阈值**
  - 自定义 rate limit
  - 自定义并发数
- ✅ **SLA（例如 99.9% API availability）**
  - 99.9% 系统可用性
  - 100% 退款保障
  - 100% 幂等保障
- ✅ **Dedicated support**
  - 专属技术支持
  - 电话 / Slack / Email
  - 4 小时内响应（紧急）

### 合同条款

- 可签年度合同
- 可开票（月结）
- 可定制 SLA
- 可定制功能

---

## 报价邮件模板

### 主题
**Enterprise Pilot Offer — $999 (No Lock-In)**

---

Hi {{Name}},

Following up on our conversation, here's a **Pilot offer** that lets you test our system risk-free:

**Pilot Package: $999**

**Includes**:
- Enterprise Batch API access
- Webhook callbacks
- Admin audit dashboard
- Automatic refunds for failed videos
- Email support (48h)

**Key Terms**:
- ✅ **Credits never expire** (use at your pace)
- ✅ **No minimum commitment** (use until credits run out)
- ✅ **Pay only for successful videos** (failures auto-refunded)
- ✅ **Cancel anytime** (no lock-in)

**Payment Link**:  
https://buy.stripe.com/6oUfZh03E6sbcttbyU0kE07

**Next Steps**:
1. Complete payment
2. I'll send you API credentials within 24h
3. Run your first batch
4. Review results in admin dashboard

**Questions?** Reply to this email or schedule a call.

Best,  
{{Your Name}}

---

## 报价对比表

| 特性 | Pilot ($999) | Growth ($4,999) | Enterprise (Custom) |
|------|--------------|-----------------|---------------------|
| **预充值** | $999 | $4,999 | $20K-50K |
| **Batch API** | ✅ | ✅ | ✅ |
| **Webhook** | ✅ | ✅ | ✅ |
| **Admin Dashboard** | ✅ (只读) | ✅ (只读) | ✅ (完整) |
| **Rate Limit** | 60 / 分钟 | 120 / 分钟 | 自定义 |
| **优先队列** | ❌ | ✅ | ✅ |
| **月度报表** | ❌ | ✅ | ✅ |
| **SLA** | ❌ | ❌ | ✅ (99.9%) |
| **IP Allowlist** | ❌ | ❌ | ✅ |
| **支持** | Email (48h) | Email (24h) + Slack | 专属 (4h) |
| **合同** | ❌ | ❌ | ✅ |
| **发票** | ❌ | ❌ | ✅ |

---

## 销售话术

### 推荐 Pilot

> "我建议我们先跑一个 **Pilot（$999）**：  
> 
> - **Credits 永久有效**（不用担心过期）  
> - **无最低承诺**（用完就停）  
> - **可随时停**（无锁定期）  
> 
> 这个 Pilot 会展示：  
> - 完整的 batch 流程  
> - 失败退款机制  
> - Admin 对账界面  
> - Webhook 通知  
> 
> 如果满意，我们再谈 Growth 或 Enterprise。  
> 如果不满意，Credits 永久有效，可以继续用。"

### 升级到 Growth

> "如果你 Pilot 使用满意，我们可以升级到 **Growth（$4,999）**：  
> 
> - **更高并发**（120 / 分钟）  
> - **优先队列**（更快处理）  
> - **月度报表**（财务对账）  
> - **Slack 支持**（可选）  
> 
> 而且，Pilot 的剩余 Credits 可以转移到 Growth。"

### 升级到 Enterprise

> "如果你需要生产级保障，我们可以谈 **Enterprise（$20K-50K）**：  
> 
> - **SLA 保障**（99.9% 可用性）  
> - **IP 白名单**（增强安全）  
> - **专属支持**（4 小时响应）  
> - **年度合同**（可开票）  
> 
> 我们可以根据你的实际需求定制方案。"

---

## 使用说明

### 1. 首单主推 Pilot

**为什么**:
- 决策门槛低（$999）
- 无风险（Credits 永久有效）
- 验证价值（实际使用）
- 建立信任（先合作，再谈大单）

### 2. 根据客户反馈升级

**Pilot → Growth**:
- 客户使用满意
- 客户需要更高并发
- 客户需要优先队列

**Growth → Enterprise**:
- 客户需要 SLA
- 客户需要 IP 白名单
- 客户需要专属支持

### 3. 报价邮件发送

- **时机**: Demo 后，客户感兴趣时
- **内容**: 使用报价邮件模板
- **跟进**: 如果 3 天未回复，发送简短跟进

---

## 关键卖点总结

### Pilot ($999)
- ✅ 决策门槛低
- ✅ 无风险
- ✅ 验证价值
- ✅ 建立信任

### Growth ($4,999)
- ✅ 更高并发
- ✅ 优先队列
- ✅ 月度报表
- ✅ Slack 支持

### Enterprise (Custom)
- ✅ SLA 保障
- ✅ IP 白名单
- ✅ 专属支持
- ✅ 年度合同

---

## 总结

**首单主推**: Pilot ($999)

**升级路径**: Pilot → Growth → Enterprise

**关键原则**: 不要一上来年约，先 Pilot 再 Growth
