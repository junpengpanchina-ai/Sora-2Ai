# AI 视频生成工具网站 - 产品需求文档 (PRD)

## 1. 项目概述

### 1.1 项目名称
Sora-2Ai - AI 视频生成平台

### 1.2 项目目标
构建一个基于 Next.js 14 的现代化 AI 视频生成工具网站，用户可以通过 Google 账号登录，使用 grsai.com 提供的 AI 视频生成服务，创建高质量的视频内容。

### 1.3 目标用户
- 内容创作者
- 视频制作爱好者
- 营销人员
- 社交媒体运营者

## 2. 技术栈

### 2.1 前端框架
- **Next.js 14** (App Router)
  - React Server Components
  - Server Actions
  - 路由和页面管理

### 2.2 样式方案
- **Tailwind CSS**
  - 响应式设计
  - 组件样式系统
  - 暗色/亮色主题支持

### 2.3 后端服务
- **Supabase**
  - PostgreSQL 数据库
  - 用户认证管理
  - 实时数据同步
  - 存储服务（可选）

### 2.4 第三方服务
- **Google OAuth 2.0**
  - 用户登录认证
  - 用户信息获取

### 2.5 AI 视频生成服务
- **grsai.com API**
  - 视频生成接口
  - 任务状态查询
  - 视频下载接口

### 2.6 其他技术
- TypeScript（类型安全）
- React Hook Form（表单处理）
- Zod（数据验证）
- NextAuth.js 或 Supabase Auth（认证集成）

## 3. 功能需求

### 3.1 用户认证模块

#### 3.1.1 Google 登录
- **功能描述**：用户使用 Google 账号登录系统
- **实现要求**：
  - 集成 Google OAuth 2.0
  - 登录成功后，用户信息存储到 Supabase 数据库
  - 支持自动登录（记住登录状态）
  - 登录失败提示和错误处理

#### 3.1.2 用户信息管理
- **功能描述**：管理用户基本信息和账户设置
- **数据字段**：
  - 用户 ID（UUID）
  - Google 用户 ID
  - 邮箱地址
  - 用户名/显示名称
  - 头像 URL
  - 创建时间
  - 最后登录时间
  - 账户状态（激活/禁用）

### 3.2 视频生成模块

#### 3.2.1 视频生成表单
- **功能描述**：用户输入视频生成参数
- **输入字段**：
  - 文本提示词（Text Prompt）- 必填
  - 视频时长（可选，默认值）
  - 视频风格（可选）
  - 分辨率设置（可选）
  - 其他高级参数（可选）

#### 3.2.2 视频生成任务
- **功能描述**：提交视频生成任务到 grsai.com API
- **实现要求**：
  - 调用 grsai.com 视频生成接口
  - 创建任务记录到 Supabase
  - 返回任务 ID 用于状态追踪
  - 显示任务提交成功提示

#### 3.2.3 任务状态管理
- **功能描述**：实时追踪视频生成任务状态
- **状态类型**：
  - `pending` - 等待中
  - `processing` - 处理中
  - `completed` - 已完成
  - `failed` - 失败
- **实现要求**：
  - 轮询或 WebSocket 实时更新任务状态
  - 显示任务进度（如可用）
  - 任务完成后自动获取视频链接

#### 3.2.4 视频预览和下载
- **功能描述**：用户查看和下载生成的视频
- **实现要求**：
  - 视频预览播放器
  - 视频下载功能
  - 视频分享链接生成（可选）
  - 视频元数据展示（生成时间、参数等）

### 3.3 历史记录模块

#### 3.3.1 视频历史列表
- **功能描述**：显示用户所有生成的视频记录
- **功能要求**：
  - 分页显示
  - 按时间排序（最新优先）
  - 筛选功能（按状态、日期范围）
  - 搜索功能（按提示词搜索）

#### 3.3.2 视频详情页
- **功能描述**：查看单个视频的详细信息
- **显示内容**：
  - 视频预览
  - 生成参数
  - 生成时间
  - 任务状态
  - 操作按钮（下载、删除、重新生成）

### 3.4 用户中心模块

#### 3.4.1 个人资料
- **功能描述**：查看和编辑个人资料
- **可编辑字段**：
  - 显示名称
  - 头像（可选）

#### 3.4.2 使用统计
- **功能描述**：显示用户使用情况统计
- **统计内容**：
  - 总生成视频数
  - 本月生成数
  - 成功/失败任务数
  - 账户创建时间

#### 3.4.3 账户设置
- **功能描述**：账户相关设置
- **设置项**：
  - 通知偏好
  - 主题设置（亮色/暗色）
  - 退出登录

## 4. 数据库设计

### 4.1 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned'))
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
```

### 4.2 视频生成任务表 (video_tasks)

```sql
CREATE TABLE video_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT, -- grsai.com 返回的任务 ID
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- 视频时长（秒）
  resolution TEXT, -- 分辨率，如 '1920x1080'
  style TEXT, -- 视频风格
  error_message TEXT, -- 错误信息（如果失败）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_video_tasks_user_id ON video_tasks(user_id);
CREATE INDEX idx_video_tasks_status ON video_tasks(status);
CREATE INDEX idx_video_tasks_created_at ON video_tasks(created_at DESC);
CREATE INDEX idx_video_tasks_task_id ON video_tasks(task_id);
```

### 4.3 用户设置表 (user_settings) - 可选

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

## 5. API 设计

### 5.1 认证 API

#### 5.1.1 Google 登录
- **端点**：`/api/auth/google`
- **方法**：GET
- **描述**：重定向到 Google OAuth 登录页面

#### 5.1.2 登录回调
- **端点**：`/api/auth/callback/google`
- **方法**：GET
- **描述**：处理 Google OAuth 回调，创建或更新用户记录

#### 5.1.3 退出登录
- **端点**：`/api/auth/logout`
- **方法**：POST
- **描述**：清除用户会话

### 5.2 视频生成 API

#### 5.2.1 创建视频生成任务
- **端点**：`/api/videos/generate`
- **方法**：POST
- **请求体**：
```json
{
  "prompt": "string (required)",
  "duration": "number (optional)",
  "style": "string (optional)",
  "resolution": "string (optional)"
}
```
- **响应**：
```json
{
  "taskId": "uuid",
  "status": "pending",
  "message": "任务已提交"
}
```

#### 5.2.2 查询任务状态
- **端点**：`/api/videos/[taskId]/status`
- **方法**：GET
- **响应**：
```json
{
  "taskId": "uuid",
  "status": "processing|completed|failed",
  "videoUrl": "string (if completed)",
  "error": "string (if failed)",
  "progress": "number (0-100, optional)"
}
```

#### 5.2.3 获取视频列表
- **端点**：`/api/videos`
- **方法**：GET
- **查询参数**：
  - `page`: number (默认 1)
  - `limit`: number (默认 20)
  - `status`: string (可选筛选)
  - `search`: string (可选搜索)
- **响应**：
```json
{
  "videos": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 5.2.4 获取视频详情
- **端点**：`/api/videos/[taskId]`
- **方法**：GET
- **响应**：完整的视频任务对象

#### 5.2.5 删除视频任务
- **端点**：`/api/videos/[taskId]`
- **方法**：DELETE
- **响应**：
```json
{
  "success": true,
  "message": "视频已删除"
}
```

### 5.3 grsai.com API 集成

#### 5.3.1 视频生成接口
- **端点**：`https://grsai.com/api/v1/videos/generate`（示例）
- **方法**：POST
- **认证**：API Key 或 Token
- **请求体**：
```json
{
  "prompt": "string",
  "duration": "number",
  "style": "string",
  "resolution": "string"
}
```

#### 5.3.2 任务状态查询
- **端点**：`https://grsai.com/api/v1/videos/[taskId]/status`（示例）
- **方法**：GET

#### 5.3.3 视频下载
- **端点**：`https://grsai.com/api/v1/videos/[taskId]/download`（示例）
- **方法**：GET

## 6. 页面结构

### 6.1 公开页面

#### 6.1.1 首页 (`/`)
- **功能**：
  - 产品介绍
  - 功能展示
  - 登录入口
  - 示例视频展示

#### 6.1.2 登录页 (`/login`)
- **功能**：
  - Google 登录按钮
  - 登录说明

### 6.2 受保护页面（需要登录）

#### 6.2.1 视频生成页 (`/generate`)
- **功能**：
  - 视频生成表单
  - 实时任务状态显示
  - 生成历史快速访问

#### 6.2.2 历史记录页 (`/history`)
- **功能**：
  - 视频列表展示
  - 筛选和搜索
  - 分页导航

#### 6.2.3 视频详情页 (`/videos/[taskId]`)
- **功能**：
  - 视频预览
  - 详细信息展示
  - 下载和分享功能

#### 6.2.4 用户中心 (`/profile`)
- **功能**：
  - 个人资料编辑
  - 使用统计
  - 账户设置

## 7. UI/UX 设计要求

### 7.1 设计原则
- **现代化**：采用现代、简洁的设计风格
- **响应式**：支持桌面、平板、移动端
- **易用性**：直观的用户界面，清晰的操作流程
- **性能**：快速加载，流畅交互

### 7.2 颜色方案
- 主色调：根据品牌定义
- 辅助色：支持亮色/暗色主题
- 状态色：成功（绿）、警告（黄）、错误（红）、信息（蓝）

### 7.3 组件设计
- 导航栏：Logo、导航链接、用户菜单
- 按钮：主要按钮、次要按钮、图标按钮
- 表单：输入框、文本域、选择器、开关
- 卡片：视频卡片、任务卡片
- 模态框：确认对话框、信息提示
- 加载状态：骨架屏、进度条、加载动画

### 7.4 交互反馈
- 表单验证：实时验证提示
- 操作反馈：成功/失败提示（Toast）
- 加载状态：任务处理中的视觉反馈
- 错误处理：友好的错误提示页面

## 8. 安全要求

### 8.1 认证安全
- 使用 HTTPS
- JWT Token 安全存储
- 会话管理
- CSRF 防护

### 8.2 数据安全
- 用户数据加密存储
- API 请求认证
- 输入验证和清理
- SQL 注入防护（使用参数化查询）

### 8.3 隐私保护
- 用户数据隐私政策
- 数据访问控制
- 敏感信息脱敏

## 9. 性能要求

### 9.1 页面加载
- 首屏加载时间 < 2 秒
- 使用 Next.js 图片优化
- 代码分割和懒加载

### 9.2 API 响应
- API 响应时间 < 500ms（非视频生成接口）
- 视频生成任务异步处理
- 合理的缓存策略

### 9.3 用户体验
- 流畅的页面切换
- 实时状态更新
- 离线提示（如适用）

## 10. 开发计划

### 10.1 第一阶段：基础架构（Week 1-2）
- [ ] Next.js 14 项目初始化
- [ ] Tailwind CSS 配置
- [ ] Supabase 数据库设置
- [ ] Google OAuth 集成
- [ ] 基础页面结构

### 10.2 第二阶段：核心功能（Week 3-4）
- [ ] 用户认证流程
- [ ] 视频生成表单
- [ ] grsai.com API 集成
- [ ] 任务状态管理
- [ ] 视频预览和下载

### 10.3 第三阶段：完善功能（Week 5-6）
- [ ] 历史记录页面
- [ ] 用户中心
- [ ] 搜索和筛选
- [ ] 响应式优化

### 10.4 第四阶段：优化和测试（Week 7-8）
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 用户体验优化
- [ ] 测试和 Bug 修复

## 11. 环境变量配置

### 11.1 必需环境变量

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# grsai.com API
GRSAI_API_KEY=your_grsai_api_key
GRSAI_API_URL=https://grsai.com/api/v1

# NextAuth (如果使用)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 12. 部署要求

### 12.1 部署平台
- 推荐：Vercel（Next.js 原生支持）
- 备选：Netlify、AWS、自建服务器

### 12.2 部署前检查清单
- [ ] 环境变量配置
- [ ] 数据库迁移完成
- [ ] API 密钥配置
- [ ] 域名和 SSL 证书
- [ ] 错误监控（如 Sentry）
- [ ] 性能监控

## 13. 后续扩展功能（可选）

### 13.1 高级功能
- 视频编辑功能
- 批量生成
- 视频模板库
- 协作功能（团队共享）
- API 开放平台

### 13.2 商业化功能
- 订阅计划（免费/付费）
- 使用额度管理
- 支付集成
- 发票系统

### 13.3 社交功能
- 视频分享社区
- 点赞和评论
- 视频收藏
- 用户关注

## 14. 风险评估

### 14.1 技术风险
- grsai.com API 稳定性
- 视频生成时间不确定
- 存储成本（如果存储视频）

### 14.2 业务风险
- API 调用费用
- 用户增长带来的服务器压力
- 数据隐私合规

### 14.3 缓解措施
- API 调用限流
- 异步任务处理
- 定期数据备份
- 监控和告警系统

## 15. 成功指标

### 15.1 技术指标
- 系统可用性 > 99%
- API 响应时间 < 500ms
- 错误率 < 1%

### 15.2 业务指标
- 用户注册转化率
- 视频生成成功率
- 用户留存率
- 平均生成视频数/用户

---

## 附录

### A. 参考资源
- [Next.js 14 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)

### B. 项目结构建议

```
sora-2ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 受保护页面
│   ├── api/               # API 路由
│   └── layout.tsx
├── components/             # React 组件
│   ├── ui/                # 基础 UI 组件
│   ├── video/             # 视频相关组件
│   └── layout/            # 布局组件
├── lib/                    # 工具函数
│   ├── supabase/          # Supabase 客户端
│   ├── grsai/             # grsai.com API 客户端
│   └── utils/             # 通用工具
├── types/                  # TypeScript 类型定义
├── public/                 # 静态资源
└── prisma/                 # 数据库 schema（如果使用 Prisma）
```

---

**文档版本**：v1.0  
**最后更新**：2024  
**维护者**：开发团队

