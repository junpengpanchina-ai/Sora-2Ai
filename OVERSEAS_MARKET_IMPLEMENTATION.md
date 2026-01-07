# 海外市场完整实现总结

## ✅ 已完成的页面

### 1. Veo Pro 购买页（app/veo-pro/page.tsx）

- ✅ Hero section: "Studio-grade video quality for your final export"
- ✅ What you get: Cleaner motion, Higher detail, Best for publishing
- ✅ How it works: 2-step workflow
- ✅ Credit usage: Sora 10, Veo Flash 50, Veo Pro 250
- ✅ When to use each model: Veo Pro vs Sora
- ✅ Packages: Creator (Most popular), Studio (Recommended), Pro
- ✅ Trust section: Transparent and predictable
- ✅ Mini FAQ

### 2. Pricing 页（app/pricing/page.tsx）

- ✅ Hero: "Credits that fit your workflow"
- ✅ 4 档计划：Starter Access, Creator (Recommended), Studio, Pro
- ✅ Credit usage table: 清晰的表格展示
- ✅ Recommended workflow: 2-step workflow
- ✅ Why not subscriptions: 强调一次性购买
- ✅ FAQ Preview: 5 个常见问题

### 3. FAQ 页（app/faq/page.tsx）

- ✅ Credits & Expiration: 3 个问题
- ✅ Models & Quality: 2 个问题
- ✅ Starter Access: 3 个问题
- ✅ Payments & Refunds: 2 个问题
- ✅ Fair Use: 2 个问题
- ✅ CTA: View Pricing / Start Creating

## 🎯 核心策略（海外市场）

### 定位

- **Sora**: Everyday creator model (drafts, iterations, consistent style)
- **Veo Flash**: Quality upgrade (better detail, still fast)
- **Veo Pro**: Final cut / Studio grade (best realism + motion)

### 禁用词汇

- ❌ cheap / low cost / budget
- ✅ everyday / draft / iteration / workflow

### 定价心理锚点

- **Sora**: $0.195 / render (Creator pack)
- **Veo Flash**: $0.975 / render
- **Veo Pro**: $4.875 / render

## 📋 待完成的工作

### 1. 更新积分扣除逻辑

需要将现有的 `deductCredits()` 替换为：
- 使用 `deduct_credits_from_wallet()`（优先 Bonus）
- 检查 Bonus 是否可用于模型（Veo Pro 不能用 Bonus）

### 2. 更新充值流程

需要在充值成功时：
- 识别充值档位（Starter $4.9, Creator $39, Studio $99, Pro $299）
- 调用 `add_credits_to_wallet()` 设置永久/Bonus 积分
- 如果是 Starter，设置 `starter_purchased_at` 和限制

### 3. Starter Access 规则（产品逻辑）

- ✅ Bonus 7 天过期
- ✅ Veo Pro 禁用
- ✅ Daily cap: Sora 6/day, Veo Flash 1/day
- ✅ Spend bonus first
- ✅ Concurrency: 1
- ✅ Queue priority: low

### 4. 触发点组件集成

需要在视频成功页添加：
- Trigger 2: remix ≥3
- Trigger 3: export click

## 🚀 Q1 涨价窗口（海外市场）

### 第一段（Jan 7 – Feb 15）

- 不涨价，只跑通 Starter→Creator→Veo Pro 路径
- 积累数据：Creator 购买转化率、Veo Pro 使用率、退款率

### 第二段（Feb 16 – Mar 31）

**调整信号**（出现后 7–14 天再调价）：
- Creator pack 购买转化率稳定（波动 <15%）
- Veo Pro 使用率达到 15–25%
- 退款/拒付率低且稳定

**调整方案**（二选一）：
- 方案 1：Creator bonus 从 +600 → +450（更隐蔽）
- 方案 2：Creator $39 → $42（涨 5–10%）

## 💡 关键洞察

**你现在已经不是在做「AI 视频工具」，而是在做：**

**"视频预览层 + 成果升级层"的平台结构 + 智能增长系统 + 完整风控体系 + 钱包系统 + 海外市场定位**

这在 2026 年是极少数人能想清楚的路径。

