# 定价系统更新总结

## ✅ 已完成的更新

### 1. PricingPage 组件更新
- ✅ Hero 标题更新为："Pricing that fits your workflow — draft fast, finish clean"
- ✅ 副标题更新为："Use Sora for everyday iteration. Upgrade the final cut with Veo when quality matters."
- ✅ 添加信任线："Credits never expire. Bonus credits may have an expiry (clearly labeled)."

### 2. 定价包更新（新结构）

#### Starter Access — $4.90
- ✅ 120 bonus credits (expires in 7 days)
- ✅ 文案更新为："Great for testing the workflow"
- ✅ Daily limits 说明更新

#### Creator Pack — $39 (Recommended)
- ✅ 600 permanent credits（从 2,000 下调）
- ✅ +60 bonus credits (expires in 30 days)
- ✅ 文案更新为："Access to Sora, Veo Fast, and Veo Pro"

#### Studio Pack — $99
- ✅ 1,800 permanent credits（从 6,000 下调）
- ✅ +270 bonus credits (expires in 45 days)
- ✅ Badge 更新为："Best value for Veo Pro"
- ✅ 文案更新为："Built for final exports and client work"

#### Pro Pack — $299
- ✅ 6,000 permanent credits（从 20,000 下调）
- ✅ +1,200 bonus credits (expires in 60 days)
- ✅ Badge 更新为："For teams & heavy usage"

### 3. Workflow Section 更新
- ✅ 标题更新为："A workflow you can scale"
- ✅ 添加说明："You don't need Veo Pro for every render — only for the final cut."

### 4. FAQ 更新
- ✅ 更新为 6 个问题（按用户提供的英文文案）
- ✅ 包含："Which model should I use?" 和 "Is there a daily limit?"

### 5. CreditUsageTable 更新
- ✅ 标题更新为："How many credits does each render take?"
- ✅ "Best for" 文案更新：
  - Sora: "Best for drafts, rapid iteration, storyboarding"
  - Veo Fast: "Best for quick quality upgrades and speed"
  - Veo Pro: "Best for final exports, motion realism, studio-grade fidelity"

### 6. VeoProPage 组件更新
- ✅ Hero 标题更新为："Veo Pro — Studio-grade final exports"
- ✅ 副标题更新为："Upgrade the version you're publishing. Smoother motion, higher realism, cleaner detail."
- ✅ CTA 按钮更新为："Upgrade with Veo Pro" 和 "See pricing"
- ✅ "What you get" 部分更新为 3 个卡片
- ✅ 添加 "Choose the right model" 部分
- ✅ "Transparent and predictable" 部分更新
- ✅ 底部 CTA 更新为："Ready for a cleaner final export?" + "Upgrade with Veo Pro"

### 7. UpgradeNudge 组件更新
- ✅ 创建 `UpgradeNudgeCopy.ts` 文件，包含所有触发点的文案
- ✅ 更新组件以使用新的文案系统
- ✅ 支持 8 个触发点（包括新增的 `commercial_format` 和 `retry_same_prompt_3`）

### 8. 文档创建
- ✅ `PRICING_COST_ANALYSIS.md` - 完整的成本分析、毛利表、现金流预测
- ✅ `PRICING_UPDATE_SUMMARY.md` - 本次更新总结

---

## 📊 新定价结构总结

### 积分消耗（不变）
- Sora: 10 credits / render
- Veo Fast: 50 credits / render
- Veo Pro: 250 credits / render

### 定价包（新）
- **Starter**: $4.90 → 120 bonus credits (7 days)
- **Creator**: $39 → 600 permanent + 60 bonus (30 days)
- **Studio**: $99 → 1,800 permanent + 270 bonus (45 days)
- **Pro**: $299 → 6,000 permanent + 1,200 bonus (60 days)
- **Veo Pro Upgrade**: $14.90 → 300 bonus credits (48h) - 待实现

---

## 🎯 关键洞察

### 成本优势
- **真实成本**（按 ¥99 包）：Sora $0.0138, Fast $0.0688, Pro $0.3438
- **Creator 包毛利**：≈ $35.84（覆盖 $69 月固定成本只需 2 个包/月）
- **Veo Pro Upgrade 毛利**：≈ $13.44（覆盖 $69 只需 5 单/月）

### 定价策略
- **Starter** = 体验门票（不可囤积）
- **Creator** = 主力包（推荐）
- **Studio** = 最佳 Veo Pro 价值
- **Pro** = 团队/重度用户

### 用户心理锚点
- Creator 600 credits ≈ 60 Sora drafts or 12 Veo Fast or 2 Veo Pro finals
- Studio 1,800 credits ≈ 180 Sora or 36 Fast or 7 Pro
- Pro 6,000 credits ≈ 600 Sora or 120 Fast or 24 Pro

---

## 🚀 下一步

1. ✅ 定价页面已更新
2. ✅ Veo Pro 页面已更新
3. ✅ 升级提示组件已更新
4. ⏳ 创建 Veo Pro Upgrade 页面（$14.90, 300 bonus credits, 48h过期）
5. ⏳ 更新数据库迁移以支持新的定价结构
6. ⏳ 实现支付闭环 API

---

## 📝 注意事项

- 所有文案已更新为英文（符合海外市场）
- 定价结构已优化（单价随档位下降，用户直觉正确）
- Starter 防薅机制已明确（7天过期、限频、只买一次）
- 成本分析文档已创建（包含现金流预测）

