# 完整定价策略文档

## 📋 目录

1. [核心定价结构](#核心定价结构)
2. [模型定位与消耗](#模型定位与消耗)
3. [定价包详情](#定价包详情)
4. [成本分析与毛利](#成本分析与毛利)
5. [防薅机制](#防薅机制)
6. [用户习惯形成策略](#用户习惯形成策略)
7. [Q1 涨价缓冲层](#q1-涨价缓冲层)
8. [现金流预测](#现金流预测)

---

## 核心定价结构

### 积分消耗（统一标准）

| 模型 | 消耗积分 | 定位 |
|------|---------|------|
| **Sora** | 10 credits | 日常迭代、快速预览 |
| **Veo Flash** | 50 credits | 质量升级、保持速度 |
| **Veo Pro** | 250 credits | 最终成片、工作室级 |

### 定价包（一次性充值）

| 档位 | 价格 | 永久积分 | Bonus 积分 | Bonus 过期 | Veo Pro 访问 |
|------|------|----------|------------|------------|--------------|
| **Starter Access** | $4.90 | 0 | 200 | 7 天 | ❌ 锁定 |
| **Creator Pack** | $39 | 2,000 | 600 | 14 天 | ✅ 可用 |
| **Studio Pack** | $99 | 6,000 | 1,500 | 30 天 | ✅ 可用 |
| **Pro Pack** | $299 | 20,000 | 4,000 | 60 天 | ✅ 可用 |

### 单次成本（以 Creator 包为例）

- **Sora**: $0.195 / render
- **Veo Flash**: $0.975 / render
- **Veo Pro**: $4.875 / render

---

## 模型定位与消耗

### Sora（默认起点）

**定位**：
- ✅ Everyday creator model
- ✅ Drafts, iterations, consistent style
- ✅ Fast visual draft to explore ideas

**禁用词汇**：
- ❌ cheap / low cost / budget
- ❌ basic / simple version

**使用场景**：
- 快速预览和探索
- 迭代和测试
- 故事板制作

### Veo Flash（质量升级）

**定位**：
- ✅ Quality upgrade
- ✅ Better detail, still fast
- ✅ Quick quality upgrade without slowing down

**使用场景**：
- 需要更高质量但仍需速度
- 快速质量提升

### Veo Pro（最终成片）

**定位**：
- ✅ Final cut / Studio grade
- ✅ Best realism + motion
- ✅ Production-ready output

**使用场景**：
- 最终导出
- 客户作品
- 营销视频
- 产品展示

---

## 定价包详情

### Starter Access — $4.90

**定位**：体验门票，不可囤积

**包含**：
- 200 bonus credits（7 天过期）
- 永久积分：0

**限制**：
- ✅ Veo Pro 锁定
- ✅ Daily caps: Sora 6/day, Veo Flash 1/day
- ✅ 并发：1
- ✅ 队列优先级：低
- ✅ 一人一次（账号/设备/支付方式）

**防薅机制**：
1. Bonus 7 天过期（无法囤积）
2. 日限额限制
3. 设备/IP 绑定
4. 购买记录检查

### Creator Pack — $39（推荐）

**定位**：主力包，适合大多数用户

**包含**：
- 2,000 permanent credits（永久）
- 600 bonus credits（14 天过期）

**权益**：
- ✅ 访问所有模型（Sora + Veo Flash + Veo Pro）
- ✅ 标准队列优先级
- ✅ 并发：2

**价值**：
- ≈ 200 次 Sora
- ≈ 40 次 Veo Flash
- ≈ 8 次 Veo Pro

### Studio Pack — $99

**定位**：最佳 Veo Pro 价值

**包含**：
- 6,000 permanent credits（永久）
- 1,500 bonus credits（30 天过期）

**权益**：
- ✅ 访问所有模型
- ✅ 更高队列优先级
- ✅ 并发：3

**价值**：
- ≈ 600 次 Sora
- ≈ 120 次 Veo Flash
- ≈ 24 次 Veo Pro

### Pro Pack — $299

**定位**：团队和重度用户

**包含**：
- 20,000 permanent credits（永久）
- 4,000 bonus credits（60 天过期）

**权益**：
- ✅ 访问所有模型
- ✅ 最高队列优先级
- ✅ 并发：5

**价值**：
- ≈ 2,000 次 Sora
- ≈ 400 次 Veo Flash
- ≈ 80 次 Veo Pro

---

## 成本分析与毛利

### 真实成本（RMB 拿货 → USD 售卖）

**按 ¥99 包（1,600,000 供应积分）**：
- 单个供应积分成本：¥99 / 1,600,000 = ¥0.000061875
- **Sora**: 1,600 × ¥0.000061875 = ¥0.099 ≈ **$0.0138**
- **Veo Flash**: 8,000 × ¥0.000061875 = ¥0.495 ≈ **$0.0688**
- **Veo Pro**: 40,000 × ¥0.000061875 = ¥2.475 ≈ **$0.3438**

### Creator 包（$39）毛利计算

**收入**：$39
**支付费**（4.5% + $0.30，保守）：$2.06
**到账**：≈ $36.94

**成本**（用户用光 2,600 credits，假设混合使用）：
- 最差情况（全部 Veo Pro）：10.4 次 × $0.3438 = $3.58
- 实际混合使用（60% Sora, 30% Fast, 10% Pro）：
  - Sora: 1,560 credits = 156 次 × $0.0138 = $2.15
  - Fast: 780 credits = 15.6 次 × $0.0688 = $1.07
  - Pro: 260 credits = 1.04 次 × $0.3438 = $0.36
  - **总成本**: ≈ $3.58

**单个 Creator 包毛利**：≈ **$33.36**

**覆盖 $69 月固定成本需要**：
$69 / $33.36 ≈ **2.1 → 3 个 Creator 包/月** 就正现金流

### Veo Pro 单次毛利

**按 Creator 包单位成本**：
- Veo Pro 一次 = 250 credits = $4.875（账面价格）
- 扣掉成本 $0.3438 与支付费摊销后
- **单次 Pro 贡献毛利**：≈ **$4.00**

**覆盖 $69 需要**：约 **18 次 Veo Pro 渲染/月**

---

## 防薅机制

### Starter Access 阶梯锁价机制

**购买条件**：
1. ✅ 账号邮箱已验证
2. ✅ 同一设备（device_id）只能买一次
3. ✅ 同一支付方式（fingerprint / last4）只能买一次
4. ✅ 同一 IP /24 段每天最多 3 个 Starter 购买成功
5. ✅ 账号注册 < 24h 的 Starter：强制更严格 daily cap（Sora 3/day）

**运行时风控信号**：
- 同设备多账号登录
- 10 分钟内连续 render 超阈值
- 同 IP 大量新注册 + 立刻点击 Starter
- 高频失败（用失败返还刷探测）
- 多次尝试访问 Veo Pro（锁定用户的"高意图"）

**处置策略**（温和但有效）：
- 风险分高：降速、排队、提高 captcha、限制 Starter 购买、冻结 bonus credits
- 不要一上来就封号（海外用户体验很敏感）

---

## 用户习惯形成策略

### 核心战略

**Sora is not a cheap product. Sora is where people start.**

### 用户心理路径

1. **我只是想先看个大概** → 用 Sora Preview
2. **哦，这个方向还不错** → 看到预览结果
3. **这个我可能真的要用** → 看到升级选项
4. **那我换个更正式的** → 自然选择 Veo Pro

### 关键设计原则

1. **不卖**：不出现价格、升级、购买等词汇
2. **不解释**：不解释模型差异，只说使用时机
3. **不强调**：不强调"更好"、"专业"等词汇
4. **自然引导**：让用户"顺着走到升级"

### 页面文案（习惯型）

- **页面标题**：Create a Quick Video Preview
- **副标题**：Start with a fast visual draft to explore your idea
- **模型选择器**：
  - Sora: "Sora Preview - Fast, lightweight video generation for early exploration."
  - Veo Pro: "Veo Pro - Preferred when final quality and sound matter."
- **生成按钮**：Generate Preview
- **失败文案**：Trying a different variation to improve the result…
- **积分提示**：Preview credits are used for exploration. Unused credits remain available.

### 预期效果

- **Sora 使用 / DAU** > 1.8（用户习惯用 Sora）
- **Veo Pro 转化前行为**：80% 用户先用过 Sora
- **新用户 24h 留存**：明显上升

---

## Q1 涨价缓冲层

### Layer 1（现在立刻）：命名与定位（不涨价）

**目标**：让用户接受"分层"概念，而不是"贵/便宜"

- **Sora**: Sora (Fast Iteration)
- **Veo Pro**: Veo Pro (Premium Final Render)
- 页面上只写 use-case & output quality difference
- 绝不写 "cheap / low / basic"

### Layer 2（Q1 中段）：把 4.9 从"低价"改成"权限型"

**目标**：让用户认为"我买的是试用权限，不是廉价积分包"

**新定位：Starter Access (7 days)**
```
Starter Access (7 days) includes:
• Sora: 10 credits available now
• Bonus credits: time-limited (expires in 7 days)
• Daily rate limit + device binding
```

**用户心理变化**：
- ✅ "我买的是试用权限，不是廉价积分包"
- ✅ 价值感立刻上来
- ✅ 薅羊毛也难了（时间限制）

### Layer 3（Q1 后段）：涨价不改入门门槛，只改"升级路径"

**目标**：让用户感知"Pro 更值"，不是"你在变贵"

**不动**：
- ❌ 4.9 的数字（它是广告入口）
- ❌ Starter Access 的基本概念

**动**：
- ✅ Starter 的"可用次数/上限"
- ✅ Veo Pro 的 "bundle / pack" 结构
- ✅ 引入 "Priority queue / faster processing" 作为 Pro 的明确权益

### 涨价窗口期（海外市场）

**第一段（Jan 7 – Feb 15）**：
- 不涨价，只跑通 Starter→Creator→Veo Pro 路径
- 积累数据：Creator 购买转化率、Veo Pro 使用率、退款率

**第二段（Feb 16 – Mar 31）**：

**调整信号**（出现后 7–14 天再调价）：
- Creator pack 购买转化率稳定（波动 <15%）
- Veo Pro 使用率达到 15–25%
- 退款/拒付率低且稳定

**调整方案**（二选一）：
- 方案 1：Creator bonus 从 +600 → +450（更隐蔽）
- 方案 2：Creator $39 → $42（涨 5–10%）

---

## 现金流预测

### Base 模型假设

- **Day 1-30**: 每天 30 个新注册（来自 SEO + use-cases）
- **Free→Paid（7天内）**: 2.5%
- **Paid 购买结构**: Creator 60% / Studio 30% / Pro 10%
- **额外 Pro Upgrade**: 付费用户里 20% 会买 1 次（导出触发）

### 预测表

| Horizon | New users | Paid buyers | Revenue from packs | Pro upgrades | Upgrade revenue | Total revenue |
|---------|-----------|-------------|-------------------|--------------|-----------------|---------------|
| 30 days | 900 | 23 | ~$1,587 | 5 | ~$75 | ~$1,662 |
| 90 days | 2,700 | 68 | ~$4,680 | 14 | ~$209 | ~$4,889 |
| 180 days | 5,400 | 135 | ~$9,290 | 27 | ~$402 | ~$9,692 |

### 项目回本计算

**沉没成本**：
- MacBook Air M4: ¥6,000 ≈ $833
- Gemini 内容生成: $31~$486（估算区间）
- **合计**: $864 ~ $1,319

**回本所需 Veo Pro Upgrade 单数**：
- 保守：$864 / $13.44 ≈ **64 单**
- 最差：$1,319 / $13.44 ≈ **98 单**

**结论**: 累计卖出 64~98 个 Veo Pro Upgrade，就能把电脑+内容成本基本赚回来。

---

## 🎯 核心洞察

### 你现在已经不是在做「AI 视频工具」，而是在做：

**"视频预览层 + 成果升级层"的平台结构 + 智能增长系统 + 完整风控体系 + 钱包系统 + 海外市场定位**

这在 2026 年是极少数人能想清楚的路径。

### 关键成功因素

1. **Sora = 默认起点**（不是廉价替代品）
2. **Veo Pro = 最终成片**（不是强制升级）
3. **Starter = 体验门票**（不是永久积分包）
4. **一次性充值**（不是订阅制）
5. **Bonus 过期机制**（防止囤积）
6. **智能升级提示**（无感引导）

---

## 📊 验收指标

### 功能验收

- [ ] 数据库迁移执行成功
- [ ] Stripe Payment Links 配置成功回跳 URL
- [ ] 支付成功后积分正确入账（永久 + Bonus）
- [ ] Starter 日限额正确执行
- [ ] Veo Pro 在 Starter 计划中被锁定
- [ ] Bonus 积分优先扣除（Veo Pro 除外）
- [ ] Bonus 过期后自动失效

### 数据验收

- [ ] `wallets` 表数据正确
- [ ] `user_entitlements` 表正确更新
- [ ] `usage_daily` 表正确记录
- [ ] `purchases` 表正确记录（幂等性）

### 业务验收

- [ ] Sora 使用 / DAU > 1.8
- [ ] Veo Pro 转化前行为：80% 用户先用过 Sora
- [ ] 新用户 24h 留存明显上升
- [ ] Creator 包购买转化率稳定
- [ ] Veo Pro 使用率达到 15–25%

---

**文档版本**: 1.0  
**最后更新**: 2026-01-07  
**状态**: ✅ 完整实现

