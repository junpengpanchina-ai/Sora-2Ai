# Supabase 组织设置建议

## 📋 两个设置分析

### 1. Supabase Assistant Opt-in Level（数据隐私设置）

**当前状态**：Disabled（已禁用）

**选项说明**：
- **Disabled**（当前）：不共享任何数据库信息，AI 回答是通用的
- **Schema Only**：只共享数据库结构（表名、列名、数据类型），不共享实际数据
- **Schema & Logs**：共享结构和日志（可能包含 PII/数据库数据）
- **Schema, Logs & Database Data**：完全访问，允许第三方 AI 运行只读查询

**建议**：⭐⭐⭐ **保持 Disabled 或选择 Schema Only**

**理由**：
- ✅ **生产环境安全**：不共享实际数据，保护用户隐私
- ✅ **符合最佳实践**：最小权限原则
- ✅ **如果只需要结构信息**：Schema Only 足够，且相对安全
- ⚠️ **如果选择更高级别**：会共享实际数据，需要评估风险

**推荐**：
- **生产环境**：保持 **Disabled** 或选择 **Schema Only**
- **开发环境**：可以选择 **Schema Only** 以获得更好的 AI 支持

---

### 2. Require MFA to access organization（安全设置）

**当前状态**：关闭（Off）

**功能说明**：
- 要求所有团队成员启用 MFA（多因素认证）
- 必须拥有有效的 MFA 会话才能访问组织和项目

**建议**：⭐⭐⭐ **强烈建议开启**

**理由**：
- ✅ **提高安全性**：防止账户被盗用
- ✅ **保护数据**：即使密码泄露，也需要 MFA 验证
- ✅ **行业标准**：MFA 是安全最佳实践
- ✅ **保护 Pro 计划**：避免未授权访问导致费用损失

**推荐**：
- **立即开启**：提高组织安全性
- **要求所有成员启用 MFA**：确保每个人都受到保护

---

## 🎯 最终建议

### 设置 1: Supabase Assistant Opt-in Level

**建议**：保持 **Disabled** 或选择 **Schema Only**

**操作**：
- 如果不需要 AI 辅助功能，保持 **Disabled**
- 如果需要 AI 辅助但不想共享数据，选择 **Schema Only**

### 设置 2: Require MFA to access organization

**建议**：**立即开启** ⭐⭐⭐

**操作**：
1. 将开关切换到 **On**
2. 点击 **Save changes**
3. 确保所有团队成员都已启用 MFA

---

## 📊 优先级排序

### 高优先级（立即操作）

1. **Require MFA** ⭐⭐⭐
   - 立即开启
   - 提高安全性
   - 保护 Pro 计划账户

### 中优先级（可选）

2. **Supabase Assistant Opt-in Level** ⭐⭐
   - 如果需要 AI 辅助，选择 **Schema Only**
   - 如果不需要，保持 **Disabled**

---

## 🔒 安全最佳实践

### 必须开启

- ✅ **Require MFA**：多因素认证是必须的

### 谨慎开启

- ⚠️ **Supabase Assistant**：
  - 生产环境：保持 Disabled 或 Schema Only
  - 开发环境：可以选择 Schema Only

---

## 📝 操作步骤

### 开启 MFA 要求

1. 访问：https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/settings/security
2. 找到 "Require MFA to access organization"
3. 将开关切换到 **On**
4. 点击 **Save changes**

### 配置 Supabase Assistant（可选）

1. 访问：https://supabase.com/dashboard/org/afwecwqmahxrgmicbpem/settings/general
2. 找到 "Supabase Assistant Opt-in Level"
3. 选择：
   - **Disabled**（推荐生产环境）
   - **Schema Only**（如果需要 AI 辅助）
4. 点击 **Save**

---

## ✅ 总结

### 必须开启

- ✅ **Require MFA**：立即开启，提高安全性

### 可选开启

- ⚠️ **Supabase Assistant**：
  - 生产环境：保持 **Disabled**
  - 如果需要：选择 **Schema Only**（相对安全）

---

**建议：立即开启 MFA 要求，Supabase Assistant 保持 Disabled 或选择 Schema Only！** 🔒

