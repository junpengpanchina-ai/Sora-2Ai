# Sora2 SEO Infrastructure - Change Log

> **基线版本**: v1.0 (2026-01-24)  
> **当前版本**: v1.1 (2026-01-24)  
> **归档位置**: `docs/archive/`

---

## 版本管理原则

```
1. v1.0 是不可修改的基线版本
2. 所有变更通过 Change Log 追踪
3. 重大变更需要版本号升级
4. 归档版本保存在 docs/archive/
```

---

## [v1.1.3] - 2026-01-24

### 新增

1. **seo-scaling-gate.ts 完整实现**
   - `scripts/seo-scaling-gate.ts`
   - 内嵌 JSON Policy
   - 支持 ENV JSON 和 Supabase 数据源
   - Exit codes: 0/2/3/4/10

2. **Index Health Dashboard Schema**
   - `supabase/migrations/114_seo_daily_metrics_schema.sql`
   - 表：`seo_daily_metrics`, `seo_gate_decisions`
   - 视图：`v_index_health`, `v_latest_gate_decision`, `v_seo_dashboard_summary`
   - Helper functions: `upsert_seo_daily_metrics`, `record_gate_decision`

3. **Investor Due Diligence 附录**
   - `docs/investor/DUE_DILIGENCE_SEO_APPENDIX.md`
   - 可直接贴进 Data Room
   - 架构图 + 风险管理 + 审计说明

---

## [v1.1.2] - 2026-01-24

### 新增

1. **SEO Scaling Gate Policy 正式文档**
   - `docs/SEO_SCALING_GATE.md`
   - 工程/SEO/商业共用的单一真相源
   - 完整决策矩阵和审计要求

2. **投资人 1 页扩容图**
   - `docs/investor/SEO_SCALING_ARCHITECTURE_ONE_PAGE.md`
   - 可直接用于 PPT/Notion/投资人沟通

3. **CI/CD JSON Gate Rule**
   - `config/seo-gate-rules.json`
   - 机器可读的完整规则定义
   - 包含阈值、原因码、告警配置

### 变更

- 主指南新增 config 目录索引

---

## [v1.1.1] - 2026-01-24

### 新增

1. **sitemap-core 准入 Gate Policy**
   - `docs/policies/SITEMAP_CORE_ADMISSION_POLICY.md`
   - 5 个硬性准入条件
   - 审计日志模板

2. **Index Rate 红/黄/绿阈值定义**
   - `docs/policies/INDEX_RATE_THRESHOLDS.md`
   - 🟢 GREEN ≥ 70%: 允许扩容
   - 🟡 YELLOW 40-69%: 观察
   - 🔴 RED < 40%: 冻结

3. **14 天极简观测表**
   - `docs/playbooks/14_DAY_OBSERVATION_CHECKLIST.md`
   - 每天 5 个指标
   - 每天 3 个问题
   - 14 天追踪表模板

### 变更

- 主指南新增 Policy 和 Playbook 文档索引

---

## [v1.1] - 2026-01-24

### 新增

1. **BLOCKED Reason Code 体系**
   - `BLOCKED_TIER1_EMPTY`: tier1-0 为空
   - `BLOCKED_LOW_INDEX_RATE`: Index Rate < 40%
   - `BLOCKED_INDEX_DELTA_NEGATIVE`: 连续 3 天负增长
   - `BLOCKED_HIGH_DUPLICATE`: Duplicate Rate > 20%

2. **Gate Override 禁止条款**
   - 明确写入 SOP：`No manual override is allowed when SEO Gate is BLOCKED`
   - 这是为"未来的自己"准备的约束

3. **Index Rate 稳定性指标**
   - 新增 7 日移动平均 (7d MA)
   - 防止单日波动误判

4. **Preview 不构成承诺条款**
   - ToS 新增：`Preview features do not imply future availability or contractual obligation`
   - 防止"你上次给我看过"型纠纷

5. **心理误判提醒**
   - 公司注册触发条件新增：`"觉得自己应该注册公司" ≠ 触发条件`
   - 防止被焦虑推着走

### 变更

- `docs/SORA2_SEO_INFRA_COMPLETE_GUIDE.md` 升级到 v1.1
- `docs/legal/TERMS_OF_SERVICE_INDIVIDUAL.md` 新增 Preview 条款
- `docs/operations/COMPANY_REGISTRATION_TRIGGERS.md` 新增心理误判提醒

### 归档

- `docs/archive/SORA2_SEO_INFRA_COMPLETE_GUIDE_v1.0.md` (基线版本，不可修改)

---

## [v1.0] - 2026-01-24

### 初始版本

**起源**: Sitemap off-by-one bug 修复

**包含内容**:

1. 事故复盘：Sitemap Off-by-One Bug
2. SEO Infrastructure 架构
3. Index Health Dashboard
4. 自动化健康检查
5. GSC 冷启动 14 天行动表
6. SEO 扩容 SOP
7. 个人身份运营指南
8. Enterprise Preview 策略
9. 法律文档体系
10. 公司注册触发条件
11. 完整文件清单

**文件清单**:

| 类别 | 文件数 |
|------|--------|
| 技术文档 | 6 |
| 数据库迁移 | 2 |
| 脚本 | 4 |
| 销售文档 | 7 |
| 法律文档 | 4 |
| 投资人文档 | 4 |
| 运营文档 | 1 |
| 网站资源 | 2 |

---

## 版本号规则

| 版本 | 含义 | 示例 |
|------|------|------|
| **Major (x.0)** | 重大架构变更 | v2.0 = 注册公司后 |
| **Minor (1.x)** | 功能增强 | v1.1 = 增强点 |
| **Patch (1.1.x)** | 修复/澄清 | v1.1.1 = typo 修复 |

---

## 预期的未来版本

| 版本 | 触发条件 | 主要变更 |
|------|----------|----------|
| **v1.2** | 第一个 serious 客户 | 实战验证后的调整 |
| **v1.3** | 60 天运营数据 | 基于数据的阈值调整 |
| **v2.0** | 注册公司 | MSA/SLA 从备用切换为启用 |

---

## 变更提交规范

```
feat(seo-infra): 简短描述

- 具体变更 1
- 具体变更 2

Ref: CHANGELOG.md v1.x
```

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
