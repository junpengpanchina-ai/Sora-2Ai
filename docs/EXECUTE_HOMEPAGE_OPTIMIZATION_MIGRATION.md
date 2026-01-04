# 首页优化迁移执行指南

## 📋 概述

此迁移将优化首页设置，改进 Hero 文案和 CTA，使其更符合消费者需求，从 "Best Sora Alternative" 转向价值承诺。

## ⚠️ 重要提示

**此迁移只会更新文本字段，不会删除或修改现有数据：**
- ✅ 保留所有现有的图片和视频路径
- ✅ 只更新 Hero 区域的文案
- ✅ 只更新 CTA 按钮文本
- ✅ 安全可逆（如果需要，可以通过 admin 后台恢复）

## 🚀 执行步骤（推荐方式：Supabase Dashboard）

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择你的项目（Sora AI Platform）

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 复制并执行迁移 SQL

1. 打开文件：`supabase/migrations/045_optimize_homepage_settings.sql`
2. **全选并复制**所有内容（Ctrl+A / Cmd+A，然后 Ctrl+C / Cmd+C）
3. 粘贴到 Supabase SQL Editor 中
4. 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）

### 步骤 4: 验证执行结果

执行成功后，你应该看到：
- ✅ "Success. No rows returned" 或 "UPDATE X" 消息
- ✅ 没有错误信息

**验证方法**：
1. 在左侧菜单中，点击 **Table Editor**
2. 找到 `homepage_settings` 表
3. 查看 `is_active = true` 的记录
4. 确认以下字段已更新：
   - `hero_badge_text` = 'AI Video Generator'
   - `hero_h1_text` = 'Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills'
   - `cta_primary_text_logged_out` = 'Start Generating Videos Free'
   - `cta_secondary_text` = 'View AI Video Examples'

## 📊 迁移内容说明

此迁移会更新以下字段：

1. **Hero Badge Text**: `AI Video Generator`
2. **Hero H1 Text (未登录)**: `Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills`
3. **Hero H1 Text (已登录)**: `Welcome back, {name}! Ready to Create Your Next Video?`
4. **Hero Description**: 改为强调价值而非比较
5. **Primary CTA**: `Start Generating Videos Free`
6. **Secondary CTA**: `View AI Video Examples`

## 🔄 如果需要恢复

如果迁移后需要恢复到之前的设置，可以通过以下方式：

1. 访问 Admin Dashboard（如果有）
2. 或执行以下 SQL（恢复到之前的设置）：

```sql
UPDATE homepage_settings
SET 
  hero_badge_text = 'Best Sora Alternative',
  hero_h1_text = 'Best Sora Alternatives for AI Video Generation',
  hero_h1_text_logged_in = 'Welcome back, {name}! Create AI Videos Like Sora',
  hero_description = 'Find the best Sora alternatives for creating stunning text-to-video content. Our free AI video generator lets you create professional videos from text prompts in seconds. Compare top Sora alternatives and start creating today.',
  cta_primary_text = 'Open Video Console',
  cta_primary_text_logged_out = 'Sign in to Start',
  cta_secondary_text = 'Browse Prompt Library',
  updated_at = NOW()
WHERE is_active = true;
```

## ✅ 完成后

迁移完成后：
1. 刷新网站首页，查看新的文案和布局
2. 确认所有新的区块（使用场景、使用步骤、FAQ）正常显示
3. 测试 CTA 按钮的功能

